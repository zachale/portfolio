import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, computed, inject, signal } from "@angular/core";

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
    <button type="button" class="icon-button" (click)="toggle()" [attr.aria-expanded]="open()"
      aria-controls="tracker-admin-requests" [attr.aria-label]="label()">
      <tracker-icon name="bell" [size]="20" />
      @if (requests().length) {
        <span class="badge" aria-hidden="true">{{ requests().length }}</span>
      }
    </button>
    <span class="sr-only" role="status" aria-atomic="true">{{ requests().length ? label() : "" }}</span>
    @if (open()) {
      <div id="tracker-admin-requests" role="dialog" aria-labelledby="tracker-admin-requests-title"
        class="popover fixed inset-x-4 top-[calc(72px+env(safe-area-inset-top))] z-30 p-2 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[52px] sm:w-[360px]">
        <div class="flex items-center justify-between gap-3 py-1 pl-3">
          <p id="tracker-admin-requests-title" class="text-[15px] font-bold">Sign-in requests</p>
          <button type="button" class="icon-button" aria-label="Close" (click)="open.set(false)">
            <tracker-icon name="close" [size]="18" />
          </button>
        </div>
        <ul class="max-h-[min(60svh,480px)] space-y-2 overflow-auto p-1">
          @for (request of requests(); track request.id) {
            <li class="inset p-3">
              <div class="flex items-baseline justify-between gap-3">
                <span class="text-[15px] font-semibold">{{ request.name }}</span>
                <span class="text-[12px] text-2">{{ asked(request) }}</span>
              </div>
              <div class="mt-0.5 text-[14px] tabular-nums text-2">{{ request.phone }}</div>
              <div class="mt-3 grid grid-cols-2 gap-2">
                <button type="button" class="btn-primary" [disabled]="deciding() === request.id"
                  (click)="decide(request, 'approve')">Approve</button>
                <button type="button" class="btn-secondary" [disabled]="deciding() === request.id"
                  (click)="decide(request, 'deny')">Deny</button>
              </div>
            </li>
          } @empty {
            <li class="px-2 pb-2 text-[14px] leading-relaxed text-2">
              No one is waiting. When someone on the list asks for access, it shows up here.
            </li>
          }
        </ul>
      </div>
    }
  `,
  host: {
    class: "relative block",
    "(document:keydown.escape)": "open.set(false)",
    "(document:click)": "closeOutside($event)",
  },
})
export class AdminRequestsComponent implements OnInit, OnDestroy {
  private readonly api = inject(TrackerApi);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly open = signal(false);
  protected readonly requests = signal<AccessRequest[]>([]);
  protected readonly label = computed(() => {
    const count = this.requests().length;
    return count === 1 ? "1 sign-in request waiting" : `${count || "No"} sign-in requests waiting`;
  });
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

  protected closeOutside(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
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
