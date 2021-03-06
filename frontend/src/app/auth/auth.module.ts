import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { ResetPasswordComponent } from "./reset-password/reset-password.component";
import { SsoRedirectingComponent } from "./sso/sso-redirecting/sso-redirecting.component";
import { SsoComponent } from "./sso/sso.component";
import { VerifyEmailComponent } from "./verify-email/verify-email.component";

const routes: Routes = [
	// disabled because server side auth cookie is faster
	// { path: "sso/:service", component: SsoComponent },
	{ path: "**", redirectTo: "/" },
];

@NgModule({
	declarations: [
		SsoComponent,
		SsoRedirectingComponent,
		VerifyEmailComponent,
		ResetPasswordComponent,
	],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		MaterialModule,
		ReactiveFormsModule,
	],
	entryComponents: [
		SsoRedirectingComponent,
		VerifyEmailComponent,
		ResetPasswordComponent,
	],
})
export class AuthModule {}
