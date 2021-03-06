import { isPlatformServer } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
	Component,
	ElementRef,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { interval, Subscription } from "rxjs";
import { AmdComplicationsComponent } from "../header/download/amd-complications/amd-complications.component";
import { DownloadComponent } from "../header/download/download.component";
import { SignInComponent } from "../header/sign-in/sign-in.component";
import { UtilsService } from "../utils.service";

@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit, OnDestroy {
	// for header component
	isHomeComponent() {
		return true;
	}

	@ViewChild("video", { static: true }) videoRef: ElementRef<
		HTMLVideoElement
	>;

	videoSub: Subscription;

	year = new Date().getFullYear();

	social = [
		["Discord", "https://tivolicloud.com/discord"],
		["Blog", "https://blog.tivolicloud.com"],
	];
	resources = [
		["Documentation", "https://docs.tivolicloud.com"],
		["JavaScript API", "https://apidocs.tivolicloud.com"],
	];
	contribute = [["GitLab", "https://git.tivolicloud.com"]];

	stats: { onlineUsers: number; onlineDomains: number } = null;

	subs: Subscription[] = [];

	constructor(
		public readonly dialog: MatDialog,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly http: HttpClient,
		public readonly utilsService: UtilsService,
		@Inject(PLATFORM_ID) private readonly platformId: Object,
	) {}

	refreshStats() {
		this.http
			.get<{ onlineUsers: number; onlineDomains: number }>(
				"/api/domains/stats",
			)
			.subscribe(stats => {
				if (
					stats != null &&
					stats.onlineDomains != null &&
					stats.onlineUsers != null
				) {
					this.stats = stats;
				}
			});
	}

	ngOnInit() {
		if (isPlatformServer(this.platformId)) return;

		this.route.url.subscribe(url => {
			if (url.length === 0) return;
			if (url[0].path == "download") {
				const dialog = this.dialog.open(DownloadComponent);
				dialog.afterClosed().subscribe(() => {
					this.router.navigateByUrl("/");
				});
			} else if (url[0].path == "amd-complications") {
				const dialog = this.dialog.open(AmdComplicationsComponent, {
					maxWidth: "75vw",
					maxHeight: "90vh",
				});
				dialog.afterClosed().subscribe(() => {
					this.router.navigateByUrl("/");
				});
			}
		});

		const video = this.videoRef.nativeElement;

		const videoSub = interval(100).subscribe(() => {
			if (video.paused) {
				video
					.play()
					.then(() => {
						videoSub.unsubscribe();
					})
					.catch(err => {});
			} else {
				videoSub.unsubscribe();
			}
		});

		this.refreshStats();
		this.subs.push(
			interval(1000 * 60).subscribe(() => {
				this.refreshStats();
			}),
		);
	}

	openSignIn() {
		this.dialog.open(SignInComponent, {
			data: {
				mode: "signIn",
			},
		});
	}

	ngOnDestroy() {
		if (this.videoSub) this.videoSub.unsubscribe();
		for (const sub of this.subs) {
			sub.unsubscribe();
		}
	}
}
