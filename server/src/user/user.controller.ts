import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Put,
	Query,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
	Post,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { MetaverseAuthGuard } from "../auth/auth.guard";
import { AuthService } from "../auth/auth.service";
import { CurrentUser } from "../auth/user.decorator";
import { MulterFile } from "../common/multer-file.model";
import {
	GetUserDomainsLikesDto,
	UserUpdateDto,
	UserUpdateImageDto,
} from "./user.dto";
import { User } from "./user.schema";
import { UserService } from "./user.service";
import { MetaverseUnverifiedAuthGuard } from "../auth/auth-unverified.guard";
import { HOSTNAME } from "../environment";

@Controller("api/user")
@ApiTags("user")
export class UserController {
	constructor(
		private userService: UserService,
		private authService: AuthService,
	) {}

	@Patch("")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async updateUser(
		@CurrentUser() user,
		@Body() userUpdateDto: UserUpdateDto,
	) {
		if (userUpdateDto.email != null) user.email = userUpdateDto.email;

		if (userUpdateDto.password != null) {
			const hash = await this.authService.hashPassword(
				userUpdateDto.password,
			);
			user.hash = hash;
		}

		await user.save();
		return { success: true };
	}

	@Put("image")
	@ApiBearerAuth()
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		description: "Update user profile picture",
		type: UserUpdateImageDto,
	})
	@UseGuards(MetaverseAuthGuard())
	@UseInterceptors(
		FileInterceptor("image", {
			limits: {
				fileSize: 1000 * 1000 * 8, // 8mb
			},
		}),
	)
	async updateUserImage(
		@CurrentUser() user: User,
		@UploadedFile() file: MulterFile,
	) {
		await this.userService.changeUserImage(user, file);
		return { success: true };
	}

	@Get(":username/image")
	async getUserImage(
		@Param("username") username: string,
		@Res() res: Response,
	) {
		const response = await this.userService.getUserImage(username);

		res.set("Content-Type", response.contentType);
		if (response.stream) return response.stream.pipe(res);
	}

	// @Get("settings")
	// @ApiBearerAuth()
	// @UseGuards(MetaverseAuthGuard())
	// async getUserSettings(@CurrentUser() user) {
	// 	const userSettings = await this.userService.getUserSettings(user);
	// 	if (userSettings == null) throw new NotFoundException();

	// 	return {
	// 		interface: userSettings.interface,
	// 		avatarBookmarks: userSettings.avatarBookmarks,
	// 	};
	// }

	// @Put("settings")
	// @ApiBearerAuth()
	// @UseGuards(MetaverseAuthGuard())
	// putUserSettings(
	// 	@CurrentUser() user,
	// 	@Body() userSettingsDto: UserSettingsDto,
	// ) {
	// 	return this.userService.changeUserSettings(user, userSettingsDto);
	// }

	@Get("domain-likes")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	getDomainLikes(
		@CurrentUser() user: User,
		@Query() getUserDomainsLikesDto: GetUserDomainsLikesDto,
	) {
		return this.userService.getDomainLikes(user, getUserDomainsLikesDto);
	}

	@Get("friends")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	getFriends(@CurrentUser() user: User) {
		return this.userService.getFriends(user);
	}

	@Post("verify")
	@ApiBearerAuth()
	@UseGuards(MetaverseUnverifiedAuthGuard())
	sendVerify(@CurrentUser() user: User, @Body("email") email: string) {
		return this.userService.sendVerify(user, email);
	}

	@Get("verify/:verifyString")
	async verifyUser(
		@Param("verifyString") verifyString: string,
		@Res() res: Response,
	) {
		const { user, justVerified } = await this.userService.verifyUser(
			verifyString,
		);

		const token = this.authService.login(user).access_token;

		res.redirect(
			HOSTNAME + (justVerified ? "?emailVerified&token=" + token : ""),
		);
	}
}
