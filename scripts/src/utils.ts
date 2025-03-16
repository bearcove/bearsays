import { promises as fs } from "fs";
import { spawn } from "child_process";
import chalk from "chalk";

export interface BuildContext {
    cargoTargetDir: string;
    arch: string;
    binaryName: string;
    packageOwner: string;
    packageName: string;
    githubServerUrl: string;
    githubToken: string;
    tag: string;
    isDryRun: boolean;
}

export function formatBytes(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return chalk.cyan("0 Byte");
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return chalk.cyan(`${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`);
}

export async function spawnProcess(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: "inherit" });
        child.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
}

export function validateAndExtractBuildContext(): BuildContext {
    const requiredEnvVars = ["CARGO_TARGET_DIR", "ARCH", "BINARY_NAME"];
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.log(chalk.red(`❌ Error: ${envVar} is not set.`));
            process.exit(1);
        }
    }

    const validArchs = ["aarch64-apple-darwin", "x86_64-unknown-linux-gnu"];
    const arch = process.env.ARCH!;
    if (!validArchs.includes(arch)) {
        console.log(chalk.red(`❌ Unsupported architecture: ${arch}`));
        process.exit(1);
    }

    let isDryRun = false;
    const packageOwner = process.env.GITHUB_REPOSITORY_OWNER || "pkgowner";
    const packageName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "pkgname";
    const githubServerUrl = process.env.GITHUB_SERVER_URL || "https://example.com";
    const githubToken = process.env.FORGEJO_READWRITE_TOKEN || "placeholder_token";

    if (
        packageOwner === "pkgowner" ||
        packageName === "pkgname" ||
        githubServerUrl === "https://example.com" ||
        githubToken === "placeholder_token"
    ) {
        isDryRun = true;
    }

    let tag = "vX.Y.Z";
    if (process.env.GITHUB_REF && process.env.GITHUB_REF.startsWith("refs/tags/")) {
        tag = process.env.GITHUB_REF.replace("refs/tags/", "");
    } else {
        isDryRun = true;
    }

    console.log(
        chalk.blue(`🔑 GitHub Token: ${githubToken.slice(0, 2)}...${githubToken.slice(-2)}`),
    );

    return {
        cargoTargetDir: process.env.CARGO_TARGET_DIR!,
        arch,
        binaryName: process.env.BINARY_NAME!,
        packageOwner,
        packageName,
        githubServerUrl,
        githubToken,
        tag,
        isDryRun,
    };
}
