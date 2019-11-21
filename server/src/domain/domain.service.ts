import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectID } from "bson";
import { Model } from "mongoose";
import { HeartbeatSession } from "src/common/heartbeat";
import { derPublicKeyHeader } from "../common/der-public-key-header";
import { heartbeat } from "../common/heartbeat";
import { patchDoc, snakeToCamelCaseObject } from "../common/utils";
import { User } from "../user/user.schema";
import { UserService, UserSession } from "../user/user.service";
import { CreateDomainDto, UpdateDomainDto } from "./domain.dto";
import { Domain } from "./domain.schema";
import uuid = require("uuid");

export interface DomainSession {
	numUsers: number;
	numAnonUsers: number;
	users: UserSession[];
}

@Injectable()
export class DomainService implements OnModuleInit {
	// current online domains. this can get big!
	sessions: { [id: string]: DomainSession & HeartbeatSession } = {};

	private userService: UserService;

	constructor(
		@InjectModel("Domain") private readonly domainModel: Model<Domain>,
		private moduleRef: ModuleRef,
	) {}

	onModuleInit() {
		this.userService = this.moduleRef.get(UserService, { strict: false });
	}

	findById(id: string) {
		return this.domainModel.findById(id);
	}

	// private async findDomainFromUser(user: User, id: string) {
	// 	const userDomains = user.domains as any[];

	// 	if (userDomains.includes(id)) {
	// 		return await this.domainModel.findById(id);
	// 	} else {
	// 		throw new ForbiddenException("Domain not found in user");
	// 	}
	// }

	async createDomain(user: User, createDomainDto: CreateDomainDto) {
		const domain = new this.domainModel({
			_id: uuid(),
			author: user,
			label: createDomainDto.label,
		});

		user.domains.push(domain);
		await user.save();

		return await domain.save();
	}

	async updateDomain(domain: Domain, updateDomainDto: UpdateDomainDto) {
		if (updateDomainDto.domain == null) {
			return domain;
		}

		const dto = snakeToCamelCaseObject(updateDomainDto.domain);
		patchDoc(domain, dto);

		const heartbeatDto = updateDomainDto.domain.heartbeat;
		if (heartbeatDto) {
			const { session, isNew } = heartbeat<DomainSession>(
				this.sessions,
				domain._id,
			);

			if (isNew) {
				session.numUsers = 0;
				session.numAnonUsers = 0;
				session.users = [];
			}

			if (heartbeatDto.num_users != null)
				session.numUsers = heartbeatDto.num_users;

			if (heartbeatDto.num_anon_users != null)
				session.numAnonUsers = heartbeatDto.num_anon_users;
		}

		return await domain.save();
	}

	async setPublicKey(domain: Domain, buffer: Buffer) {
		const publicKey =
			Buffer.concat([derPublicKeyHeader, buffer])
				.toString("base64")
				.match(/.{1,60}/g)
				.join(" ") + " ";

		domain.publicKey = publicKey;
		return await domain.save();
	}

	async getUserDomains(user: User) {
		const userPopulated = await this.userService
			.findById(user.id)
			.populate("domains");

		return userPopulated.domains;
	}

	async getAllDomains(page: number, per_page: number) {
		if (page <= 0) page = 1;
		if (per_page > 50) per_page = 50;

		page -= 1;
		return this.domainModel
			.find()
			.sort({ onlineUsers: -1 })
			.limit(per_page)
			.skip(page * per_page);
	}
}
