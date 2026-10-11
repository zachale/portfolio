import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from "@angular/core";

import { relativeTime } from "../telemetry";
import { AccessRequest, TrackerApi } from "../tracker-api.service";
import { IconComponent } from "../ui/icon.component";

/** Sign-in requests waiting on Zach, each one approve or deny. */
@Component({
  selector: "tracker-admin-requests",
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="icon-button relative" (click)="toggle()" [attr.aria-expanded]="open()"
      aria-haspopup="dialog" [attr.aria-label]="'Sign-in requests: ' + requests().length">
      <tracker-icon name="bell" [size]="20" />
      @if (requests().length) {
        <span class="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[11px] font-semibold"
          style="background: #e5484d; color: white">{{ requests().length }}</span>
      }
    </button>
    @if (open()) {
      <div class="glass-strong absolute right-0 top-12 z-30 w-[min(92vw,360px)] rounded-3xl p-4" role="dialog"
        aria-label="Sign-in requests">
        <div class="flex items-center justify-between">
          <p class="eyebrow">Sign-in requests</p>
          <button type="button" class="icon-button h-8 w-8" aria-label="Close" (click)="open.set(false)">
            <tracker-icon name="close" [size]="16" />
          </button>
        </div>
        @for (request of requests(); track request.id) {
          <div class="mt-3 rounded-2xl p-3" style="background: rgba(255,255,255,0.05)">
            <div class="flex items-baseline justify-between gap-3">
              <span class="font-medium">{{ request.name }}</span>
              <span class="text-[12px]" style="color: var(--text-3)">{{ asked(request) }}</span>
            </div>
            <div class="mt-0.5 text-[13px]" style="color: var(--text-2)">{{ request.phone }}</div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button type="button" class="cta cta-small" [disabled]="deciding() === request.id"
                (click)="decide(request, 'approve')">Approve</button>
              <button type="button" class="ghost-button" [disabled]="deciding() === request.id"
                (click)="decide(request, 'deny')">Deny</button>
            </div>
          </div>
        } @empty {
          <p class="mt-3 text-[14px]" style="color: var(--text-2)">
            No one is waiting. When someone on the list asks for access, it shows up here.
          </p>
        }
      </div>
    }
  `,
  host: { class: "relative block" },
})
export class AdminRequestsComponent implements OnInit, OnDestroy {
  private readonly api = inject(TrackerApi);
  protected readonly open = signal(false);
  protected readonly requests = signal<AccessRequest[]>([]);
  protected readonly deciding = signal<string | null>(null);
  private timer = 0;

  ngOnInit(): void {
    this.poll();
    this.timer = window.setInterval(() => {
      if (document.visibilityState === "visible") this.poll();
    }, 15_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  protected toggle(): void {
    this.open.set(!this.open());
    if (this.open()) this.poll();
  }

  protected asked(request: AccessRequest): string {
    return `asked ${relativeTime(Date.parse(request.requestedAt), Date.now())}`;
  }

  protected async decide(request: AccessRequest, decision: "approve" | "deny"): Promise<void> {
    this.deciding.set(request.id);
    try {
      await this.api.decide(request.id, decision);
      this.requests.update((list) => list.filter((r) => r.id !== request.id));
    } catch {
      await this.poll();
    } finally {
      this.deciding.set(null);
    }
  }

  private async poll(): Promise<void> {
    try {
      this.requests.set(await this.api.requests());
    } catch {
      // A failed poll leaves the last list up; the next one retries.
    }
  }
}
