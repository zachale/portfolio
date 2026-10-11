import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, output, signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";

import { ApiError, RequestState, Session, TrackerApi } from "../tracker-api.service";

const POLL_MS = 4000;

/**
 * Sign-in by approval: the visitor asks with their phone number, Zach approves the request
 * from his own session, and this browser picks the approval up by polling. The request lives
 * 24 hours in an HttpOnly cookie, so closing the tab and coming back later still works.
 */
@Component({
  selector: "tracker-login-panel",
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./login-panel.component.html",
  host: { class: "block" },
})
export class LoginPanelComponent implements OnInit, OnDestroy {
  readonly signedIn = output<Session>();

  private readonly api = inject(TrackerApi);

  protected readonly step = signal<"checking" | "phone" | "waiting">("checking");
  protected readonly busy = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected phone = "";
  protected remember = true;
  private timer = 0;

  async ngOnInit(): Promise<void> {
    document.addEventListener("visibilitychange", this.onVisible);
    await this.check();
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    document.removeEventListener("visibilitychange", this.onVisible);
  }

  async request(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.notice.set(null);
    try {
      await this.api.requestAccess(this.phone, this.remember);
      this.step.set("waiting");
      this.schedule();
    } catch (error) {
      this.notice.set(error instanceof ApiError && error.status === 400
        ? "That doesn't look like a phone number. Try the full 10 digits."
        : "Couldn't reach the tracker. Check your connection and try again.");
    } finally {
      this.busy.set(false);
    }
  }

  async cancel(): Promise<void> {
    clearTimeout(this.timer);
    await this.api.cancelRequest().catch(() => undefined);
    this.notice.set(null);
    this.step.set("phone");
  }

  // Coming back from the messages app should not wait for the next poll.
  private readonly onVisible = () => {
    if (document.visibilityState === "visible" && this.step() === "waiting") this.check();
  };

  private schedule(): void {
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.check(), POLL_MS);
  }

  private async check(): Promise<void> {
    let state: RequestState;
    try {
      state = await this.api.requestState();
    } catch {
      // A blip in the connection: keep waiting if we were, and try again.
      if (this.step() === "waiting") this.schedule();
      else this.step.set("phone");
      return;
    }
    switch (state.status) {
      case "approved":
        this.signedIn.emit(state.session);
        return;
      case "pending":
        this.step.set("waiting");
        if (document.visibilityState === "visible") this.schedule();
        return;
      case "denied":
        this.notice.set("Zach declined that request.");
        break;
      case "expired":
        this.notice.set("That request expired after 24 hours. Ask again below.");
        break;
    }
    this.step.set("phone");
  }
}
