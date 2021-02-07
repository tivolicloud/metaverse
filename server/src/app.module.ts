import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TerminusModule } from "@nestjs/terminus";
import { AdminModule } from "./admin/admin.module";
import { ApiDomainsModule } from "./api/domains/domains.module";
import { ApiPlacesModule } from "./api/places/places.module";
import { ApiUserStoriesModule } from "./api/user-stories/user-stories.module";
import { ApiUserModule } from "./api/user/user.module";
import { ApiUsersModule } from "./api/users/users.module";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { DomainModule } from "./domain/domain.module";
import { EmailModule } from "./email/email.module";
import { DB_NAME, DB_URI } from "./environment";
import { FilesModule } from "./files/files.module";
import { HealthController } from "./health.controller";
import { LyndenController } from "./lynden/lynden.controller";
import { MetricsModule } from "./metrics/metrics.module";
import { OpenaiModule } from "./openai/openai.module";
import { PuppeteerModule } from "./puppeteer/puppeteer.module";
import { SessionModule } from "./session/session.module";
import { UserModule } from "./user/user.module";
import { WorldController } from "./world.controller";

@Module({
	imports: [
		// ...(!DEV
		// 	? [
		// 			// in production
		// 			SentryModule.forRoot({
		// 				dsn:
		// 					"https://35ced4ee7098404393553430f8d78e79@sentry.tivolicloud.com/3",
		// 				environment: "production",
		// 				debug: false,
		// 			}),
		// 	  ]
		// 	: [
		// 			// in development
		// 	  ]),

		// https://mongoosejs.com/docs/connections.html#options
		MongooseModule.forRoot(DB_URI, {
			dbName: DB_NAME,
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
		}),
		TerminusModule,
		MetricsModule,

		AuthModule,
		SessionModule,
		UserModule,
		DomainModule,
		AdminModule,

		EmailModule,
		PuppeteerModule,
		FilesModule,

		ApiUserModule,
		ApiUsersModule,
		ApiUserStoriesModule,
		ApiDomainsModule,
		ApiPlacesModule,

		// extras
		// VideoStreamModule,
		// ZoomModule,
		OpenaiModule,
	],
	providers: [],
	controllers: [
		AppController,
		HealthController,
		LyndenController,
		WorldController,
	],
})
export class AppModule {}
