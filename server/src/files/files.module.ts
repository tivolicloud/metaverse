import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { FilesHostController } from "./files-host.controller";
import { FilesHostService } from "./files-host.service";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
	imports: [AuthModule, UserModule],
	providers: [FilesService, FilesHostService],
	exports: [FilesService],
	controllers: [FilesController, FilesHostController],
})
export class FilesModule {}
