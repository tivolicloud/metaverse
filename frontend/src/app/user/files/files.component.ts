import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { User } from "@sentry/browser";
import { forkJoin } from "rxjs";
import { AuthService } from "src/app/auth/auth.service";
import { formatBytes } from "../../utils";
import { FilesService, Folder, Status } from "./files.service";
import { UploadComponent } from "./upload/upload.component";
import { CreateFolderComponent } from "./create-folder/create-folder.component";
import { Router, ActivatedRoute } from "@angular/router";

@Component({
	selector: "app-files",
	templateUrl: "./files.component.html",
	styleUrls: ["./files.component.scss"],
})
export class FilesComponent implements OnInit {
	public formatBytes = formatBytes;

	rootFolder = new Folder("");
	currentFolder = new Folder("");

	loading = true;
	status: Status;
	total = 0;

	user: User;

	constructor(
		public readonly filesService: FilesService,
		private readonly authService: AuthService,
		private readonly dialog: MatDialog,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
	) {}

	getBreadcrumbs(currentFolder?: Folder) {
		const breadcrumbs: Folder[] = [];
		if (currentFolder == null) currentFolder = this.currentFolder;

		while (currentFolder.parent != null) {
			breadcrumbs.unshift(currentFolder);
			currentFolder = currentFolder.parent;
		}

		return breadcrumbs;
	}

	getCurrentPath(currentFolder?: Folder) {
		return this.getBreadcrumbs(currentFolder).map(folder => folder.name);
	}

	refresh(currentPath?: string[]) {
		return new Promise(resolve => {
			this.loading = true;

			forkJoin({
				files: this.filesService.getFiles(),
				status: this.filesService.getStatus(),
			}).subscribe(data => {
				this.rootFolder = data.files.folder;
				this.total = data.files.total;
				this.status = data.status;

				const currentFolder = this.filesService.getFolder(
					currentPath || this.getCurrentPath(),
					this.rootFolder,
					false,
				);
				this.currentFolder =
					currentFolder != null ? currentFolder : this.rootFolder;

				this.loading = false;
				resolve();
			});
		});
	}

	async ngOnInit() {
		await this.refresh();

		this.route.queryParams.subscribe((query: { path: string }) => {
			if (query.path == null) {
				this.router.navigate([], {
					relativeTo: this.route,
					queryParams: {
						path: "/",
					},
				});
			} else {
				const path = (query.path.startsWith("/")
					? query.path.slice(1)
					: query.path
				).split("/");

				const currentFolder = this.filesService.getFolder(
					path,
					this.rootFolder,
					false,
				);

				this.currentFolder =
					currentFolder != null ? currentFolder : this.rootFolder;
			}
		});

		this.authService.user$.subscribe(user => {
			this.user = user;
		});
	}

	onUpload() {
		const dialog = this.dialog.open(UploadComponent, {
			width: "500px",
			data: {
				currentPath: "/" + this.getCurrentPath().join("/"),
			},
		});

		const sub = dialog.afterClosed().subscribe(() => {
			this.refresh();
			sub.unsubscribe();
		});
	}

	changeCurrentFolder(folder: Folder) {
		//this.currentFolder = folder;

		this.router.navigate(["."], {
			relativeTo: this.route,
			queryParams: {
				path: "/" + this.getCurrentPath(folder).join("/"),
			},
		});
	}

	// dragOver = false;

	// @HostListener("window:dragover", ["$event"])
	// onDragOver(event: DragEvent) {
	// 	event.preventDefault();
	// 	this.dragOver = true;
	// }

	// // @HostListener("#dragOver:dragleave", ["$event"])
	// // onDragLeave(event: DragEvent) {
	// // 	event.preventDefault();
	// // 	this.dragOver = false;
	// // 	console.log("leave");
	// // }

	// @HostListener("window:drop", ["$event"])
	// onDrop(event: DragEvent) {
	// 	event.preventDefault();
	// 	if (event.dataTransfer.files.length == 0) return;

	// 	const files = event.dataTransfer.files;
	// 	console.log(files);
	// }

	onCreateFolder() {
		const dialog = this.dialog.open(CreateFolderComponent, {
			width: "600px",
			data: {
				currentPath: "/" + this.getCurrentPath().join("/"),
			},
		});

		const sub = dialog.afterClosed().subscribe(() => {
			this.refresh();
			sub.unsubscribe();
		});
	}
}
