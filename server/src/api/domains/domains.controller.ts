import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	NotFoundException,
	Param,
	Put,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import * as uuid from "uuid";
import { CurrentDomain } from "../../auth/domain.decorator";
import { DomainAuthGuard } from "../../auth/guards/domain.guard";
import { MulterFile } from "../../common/multer-file.model";
import { renderDomainForHifi, uuidToObjectId } from "../../common/utils";
import { UpdateDomainDto } from "../../domain/domain.dto";
import { Domain } from "../../domain/domain.schema";
import { DomainService } from "../../domain/domain.service";
import { SessionService } from "../../session/session.service";

@ApiTags("from hifi")
@Controller("api/v1/domains")
export class DomainsController {
	constructor(
		private domainService: DomainService,
		private sessionService: SessionService,
	) {}

	@Get()
	@ApiOperation({
		summary: "Retrieves the domain from the domain token",
	})
	@ApiBearerAuth()
	@UseGuards(DomainAuthGuard)
	async getDomains(@CurrentDomain() domain: Domain) {
		// const docs = await this.domainService.getUserDomains(user);
		// let domains = [];

		// for (let doc of docs) {
		// 	domains.push(renderDomainForHifi(doc));
		// }

		await domain.populate("author").execPopulate();

		const session = await this.sessionService.findDomainById(domain._id);

		return {
			status: "success",
			data: {
				domains: [renderDomainForHifi(domain, session)],
			},
		};
	}

	isValidDomainId(domain: Domain, id: string) {
		if (uuid.validate(id)) {
			return uuidToObjectId(id).toHexString() == domain._id.toHexString();
		} else {
			return id == domain._id.toHexString();
		}
	}

	@Put(":id")
	@ApiBearerAuth()
	@UseGuards(DomainAuthGuard)
	async updateDomain(
		@CurrentDomain() domain: Domain,
		@Param("id") id: string,
		@Body() updateDomainDto: UpdateDomainDto,
	) {
		if (!this.isValidDomainId(domain, id)) throw new ForbiddenException();

		const updatedDomain = await this.domainService.updateDomain(
			domain,
			updateDomainDto,
		);
		await updatedDomain.populate("author").execPopulate();

		const session = await this.sessionService.findDomainById(
			updatedDomain._id,
		);

		return {
			status: "success",
			domain: renderDomainForHifi(updatedDomain, session),
		};
	}

	@Put(":id/ice_server_address")
	@ApiBearerAuth()
	@UseGuards(DomainAuthGuard)
	async updateDomainIceServer(
		@CurrentDomain() domain: Domain,
		@Param("id") id: string,
		@Body() updateDomainDto: UpdateDomainDto,
	) {
		if (!this.isValidDomainId(domain, id)) throw new ForbiddenException();

		const updatedDomain = await this.domainService.updateDomain(
			domain,
			updateDomainDto,
		);
		await updatedDomain.populate("author").execPopulate();

		const session = await this.sessionService.findDomainById(
			updatedDomain._id,
		);

		return {
			status: "success",
			domain: renderDomainForHifi(updatedDomain, session),
		};
	}

	@Put(":id/public_key")
	@ApiBearerAuth()
	@UseGuards(DomainAuthGuard)
	@UseInterceptors(FileInterceptor("public_key"))
	async putDomainPublicKey(
		@CurrentDomain() domain: Domain,
		@Param("id") id: string,
		@UploadedFile() file: MulterFile,
	) {
		if (!this.isValidDomainId(domain, id)) throw new ForbiddenException();

		await this.domainService.setPublicKey(domain, file.buffer);

		return {
			status: "success",
		};
	}

	@Get(":id/public_key")
	async getDomainPublicKey(@Param("id") id: string) {
		const domain = await this.domainService.findById(id);

		if (domain != null && domain.publicKey != null) {
			return {
				status: "success",
				data: {
					public_key: domain.publicKey,
				},
			};
		} else {
			return {
				status: "fail",
				data: {
					public_key: "there is no public key for that user",
				},
			};
		}
	}

	// TODO: still necessary for domain server
	@Get(":id")
	@ApiOperation({ deprecated: true })
	async getDomain(@Param("id") id: string) {
		const domain = await this.domainService.findById(id);
		if (domain == null) {
			throw new NotFoundException();
		}
		await domain.populate("author").execPopulate();

		const session = await this.sessionService.findDomainById(domain._id);

		return {
			status: "success",
			domain: renderDomainForHifi(domain, session),
		};
	}
}
