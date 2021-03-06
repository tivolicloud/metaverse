import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";
import { DomainModule } from "../domain/domain.module";
import { JWT_SECRET } from "../environment";
import { MetricsModule } from "../metrics/metrics.module";
import { UserModule } from "../user/user.module";
import { AttachmentsController } from "./attachments.controller";
import { FilesHostController } from "./files-host.controller";
import { FilesHostService } from "./files-host.service";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { TeaController } from "./tea.controller";
import { TeaService } from "./tea.service";

@Module({
	imports: [
		AuthModule,
		UserModule,
		JwtModule.register({
			secret: JWT_SECRET,
			signOptions: {
				noTimestamp: true,
			},
		}),
		MetricsModule,
		DomainModule,
	],
	providers: [FilesService, FilesHostService, TeaService],
	exports: [FilesService],
	controllers: [
		FilesController,
		FilesHostController,
		TeaController,
		AttachmentsController,
	],
})
export class FilesModule {}
