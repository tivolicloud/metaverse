import { Clipboard } from "@angular/cdk/clipboard";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import {
	Component,
	EventEmitter,
	HostListener,
	Inject,
	Input,
	Output,
	PLATFORM_ID,
} from "@angular/core";
import { Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { UtilsService } from "../../../utils.service";
import { File, FilesService, Folder } from "../files.service";
import { InputComponent } from "../input/input.component";

interface ContextMenu {
	type: "file" | "folder";

	file: File;
	folder: Folder;
	x: number;
	y: number;

	urlCopied: boolean;
	areYouSureDelete: boolean;
	loading: boolean;
}

@Component({
	selector: "app-folder-view",
	templateUrl: "./folder-view.component.html",
	styleUrls: ["./folder-view.component.scss"],
})
export class FolderViewComponent {
	@Input() folder: Folder;
	@Output() onFolderClick = new EventEmitter<Folder>();
	@Output() onRefresh = new EventEmitter<null>();

	previewCache = Date.now();

	constructor(
		public readonly utilsService: UtilsService,
		public readonly filesService: FilesService,
		@Inject(PLATFORM_ID) private readonly platformId: any,
		private clipboard: Clipboard,
		private dialog: MatDialog,
	) {}

	// TODO: outsource together with files.component.ts
	private getBreadcrumbs(currentFolder: Folder) {
		const breadcrumbs: Folder[] = [];

		while (currentFolder.parent != null) {
			breadcrumbs.unshift(currentFolder);
			currentFolder = currentFolder.parent;
		}

		return breadcrumbs;
	}

	onItemClick(file: File) {
		if (isPlatformBrowser(this.platformId)) window.open(file.url);
	}

	contextMenu: ContextMenu = null;

	onItemContextMenu(
		type: "file" | "folder",
		item: File | Folder,
		e: MouseEvent,
	) {
		e.preventDefault();

		this.contextMenu = {
			type,

			file: type == "file" ? (item as any) : null,
			folder: type == "folder" ? (item as any) : null,
			x: e.clientX,
			y: e.clientY,

			urlCopied: false,
			areYouSureDelete: false,
			loading: false,
		};
	}

	@HostListener("window:mousedown", ["$event"])
	private onContextMenuClickAway(e: MouseEvent) {
		if (this.contextMenu == null) return;

		if (
			[...(e as any).path].some((e: HTMLElement) =>
				e.className == undefined
					? false
					: e.className.includes("context-menu"),
			) == false
		)
			this.contextMenu = null;
	}

	onContextMenuCopyUrl() {
		this.clipboard.copy(this.contextMenu.file.url);
		this.contextMenu.urlCopied = true;
		// this.contextMenu = null;
	}

	private onContextMenuMoveFile() {
		const oldKey = this.contextMenu.file.key;

		const currentPath = oldKey
			.split("/")
			.slice(0, -1)
			.join("/");

		const dialog = this.dialog.open(InputComponent, {
			width: "600px",
			data: {
				inputSuffix: "/" + this.contextMenu.file.name,
				inputDefault: currentPath || "/",

				titleText: "Move a file",
				buttonText: "Move file",
				buttonIcon: "folder",

				validators: [],
			},
		});

		const submitSub = dialog.componentInstance.onSubmit.subscribe(
			(value: string) => {
				const newKey =
					value +
					(value.endsWith("/") ? "" : "/") +
					this.contextMenu.file.name;

				this.filesService.moveFile(oldKey, newKey).subscribe(() => {
					dialog.close();
					this.onRefresh.emit();
					this.contextMenu = null;

					submitSub.unsubscribe();
				});
			},
		);
	}

	private onContextMenuMoveFolder() {
		const currentPath = this.getBreadcrumbs(this.contextMenu.folder)
			.map(folder => folder.name)
			.join("/");

		const oldKey = "/" + currentPath;

		const dialog = this.dialog.open(InputComponent, {
			width: "600px",
			data: {
				inputPrefix: "/",
				inputDefault: currentPath,

				titleText: "Move a folder",
				buttonText: "Move folder",
				buttonIcon: "folder",

				validators: [],
			},
		});

		const submitSub = dialog.componentInstance.onSubmit.subscribe(
			(value: string) => {
				const newKey = "/" + value;

				this.filesService.moveFolder(oldKey, newKey).subscribe(() => {
					dialog.close();
					this.onRefresh.emit();
					this.contextMenu = null;

					submitSub.unsubscribe();
				});
			},
		);
	}

	onContextMenuMove() {
		if (this.contextMenu.type == "file") {
			return this.onContextMenuMoveFile();
		} else if (this.contextMenu.type == "folder") {
			return this.onContextMenuMoveFolder();
		}
	}

	private onContextMenuRenameFile() {
		const oldKey = this.contextMenu.file.key;

		const currentPath =
			oldKey
				.split("/")
				.slice(0, -1)
				.join("/") + "/";

		const dialog = this.dialog.open(InputComponent, {
			width: "600px",
			data: {
				inputPrefix: currentPath,
				inputDefault: this.contextMenu.file.name,

				titleText: "Rename a file",
				buttonText: "Rename file",
				buttonIcon: "create",

				validators: [
					Validators.pattern(/^[^\/]*?$/), // no slashes
				],
			},
		});

		const submitSub = dialog.componentInstance.onSubmit.subscribe(
			(value: string) => {
				const newKey = currentPath + value;

				this.filesService.moveFile(oldKey, newKey).subscribe(() => {
					dialog.close();
					this.onRefresh.emit();
					this.contextMenu = null;

					submitSub.unsubscribe();
				});
			},
		);
	}

	private onContextMenuRenameFolder() {
		let currentPath =
			"/" +
			this.getBreadcrumbs(this.contextMenu.folder)
				.slice(0, -1)
				.map(folder => folder.name)
				.join("/");
		if (!currentPath.endsWith("/")) currentPath += "/";

		const oldKey = currentPath + this.contextMenu.folder.name;

		const dialog = this.dialog.open(InputComponent, {
			width: "600px",
			data: {
				inputPrefix: currentPath,
				inputDefault: this.contextMenu.folder.name,

				titleText: "Rename a folder",
				buttonText: "Rename folder",
				buttonIcon: "create",

				validators: [
					Validators.pattern(/^[^\/]*?$/), // no slashes
				],
			},
		});

		const submitSub = dialog.componentInstance.onSubmit.subscribe(
			(value: string) => {
				const newKey = currentPath + value;

				this.filesService.moveFolder(oldKey, newKey).subscribe(() => {
					dialog.close();
					this.onRefresh.emit();
					this.contextMenu = null;

					submitSub.unsubscribe();
				});
			},
		);
	}

	onContextMenuRename() {
		if (this.contextMenu.type == "file") {
			return this.onContextMenuRenameFile();
		} else if (this.contextMenu.type == "folder") {
			return this.onContextMenuRenameFolder();
		}
	}

	onContextMenuDownload() {
		if (isPlatformServer(this.platformId)) return;
		window.open(this.contextMenu.file.url + "?download", "_self");
	}

	onContextMenuDelete() {
		if (this.contextMenu.areYouSureDelete == false) {
			this.contextMenu.areYouSureDelete = true;
			return;
		}

		const contextMenu = this.contextMenu;
		contextMenu.loading = true;

		const obs =
			contextMenu.type == "file"
				? this.filesService.deleteFile(this.contextMenu.file.key)
				: this.filesService.deleteFolder(
						"/" +
							this.getBreadcrumbs(this.contextMenu.folder)
								.map(folder => folder.name)
								.join("/") +
							"/",
				  );

		obs.subscribe(
			() => {
				this.onRefresh.emit();
				if (this.contextMenu == contextMenu) this.contextMenu = null;
			},
			() => {
				if (this.contextMenu == contextMenu) this.contextMenu = null;
			},
		);
	}
}
