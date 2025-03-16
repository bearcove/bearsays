#!/usr/bin/env node

/*
In addition the following variables are defined by default:

Name	Description
CI	Always set to true.
GITHUB_ACTION	The numerical id of the current step.
GITHUB_ACTION_PATH	When evaluated while running a composite action (i.e. using: "composite", the path where an action files are located.
GITHUB_ACTION_REPOSITORY	For a step executing an action, this is the owner and repository name of the action (e.g. actions/checkout).
GITHUB_ACTIONS	Set to true when the Forgejo runner is running the workflow on behalf of a Forgejo instance. Set to false when running the workflow from forgejo-runner exec.
GITHUB_ACTOR	The name of the user that triggered the workflow.
GITHUB_API_URL	The API endpoint of the Forgejo instance running the workflow (e.g. https://code.forgejo.org/api/v1).
GITHUB_BASE_REF	The name of the base branch of the pull request (e.g. main). Only defined when a workflow runs because of a pull_request or pull_request_target event.
GITHUB_HEAD_REF	The name of the head branch of the pull request (e.g. my-feature). Only defined when a workflow runs because of a pull_request or pull_request_target event.
GITHUB_ENV	The path on the runner to the file that sets variables from workflow commands. This file is unique to the current step and changes for each step in a job.
GITHUB_EVENT_NAME	The name of the event that triggered the workflow (e.g. push).
GITHUB_EVENT_PATH	The path to the file on the Forgejo runner that contains the full event webhook payload.
GITHUB_JOB	The job_id of the current job.
GITHUB_OUTPUT	The path on the runner to the file that sets the current step's outputs. This file is unique to the current step.
GITHUB_PATH	The path on the runner to the file that sets the PATH environment variable. This file is unique to the current step.
GITHUB_REF	The fully formed git reference (i.e. starting with refs/) associated with the event that triggered the workflow.
GITHUB_REF_NAME	The short git reference name of the branch or tag that triggered the workflow for push or tag events only.
GITHUB_REPOSITORY	The owner and repository name (e.g. forgejo/docs).
GITHUB_REPOSITORY_OWNER	The repository owner's name (e.g. forgejo)
GITHUB_RUN_NUMBER	A unique id for the current workflow run in the Forgejo instance.
GITHUB_SERVER_URL	The URL of the Forgejo instance running the workflow (e.g. https://code.forgejo.org)
GITHUB_SHA	The commit SHA that triggered the workflow. The value of this commit SHA depends on the event that triggered the workflow.
GITHUB_STEP_SUMMARY	The path on the runner to the file that contains job summaries from workflow commands. This file is unique to the current step.
GITHUB_TOKEN	The unique authentication token automatically created for duration of the workflow.
GITHUB_WORKSPACE	The default working directory on the runner for steps, and the default location of the repository when using the checkout action.
*/

import { promises as fs } from "fs";
import { spawn } from "child_process";
import chalk from "chalk";

function formatBytes(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return chalk.cyan("0 Byte");
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return chalk.cyan(`${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`);
}

async function spawnProcess(command: string, args: string[]): Promise<void> {
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

interface BuildContext {
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

function validateAndExtractBuildContext(): BuildContext {
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
    const githubToken =
        process.env.FORGEJO_READWRITE_TOKEN || process.env.GITHUB_TOKEN || "placeholder_token";

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

async function checkRustToolchain() {
    console.log(chalk.yellow("🔍 Checking Rust toolchain versions..."));
    await spawnProcess("rustc", ["--version"]);
    await spawnProcess("cargo", ["--version"]);
    await spawnProcess("cargo", ["sweep", "--version"]);
    console.log(chalk.green("✅ Rust toolchain versions checked"));
}

async function buildProject() {
    console.log(chalk.yellow("🔨 Building the project..."));
    const buildStart = Date.now();
    await spawnProcess("cargo", ["build", "--verbose", "--release"]);
    const buildTime = Date.now() - buildStart;
    console.log(chalk.green(`✅ Build completed successfully (${buildTime}ms)`));
    return buildTime;
}

async function createPackageArchive(context: BuildContext) {
    const packageFile = `${context.arch}.tar.xz`;
    console.log(chalk.cyan(`📦 Package file name: ${packageFile}`));

    console.log(chalk.yellow("📦 Creating package archive..."));
    const archiveStart = Date.now();
    await spawnProcess("tar", [
        "-cJvf",
        packageFile,
        "-C",
        `${context.cargoTargetDir}/release`,
        context.binaryName,
    ]);
    const archiveTime = Date.now() - archiveStart;
    console.log(chalk.green(`✅ Package archive created successfully (${archiveTime}ms)`));

    console.log(chalk.yellow("📋 Showing contents of the archive..."));
    await spawnProcess("tar", ["wtf", packageFile]);

    const stats = await fs.stat(packageFile);
    console.log(chalk.green(`📊 Archive size: ${formatBytes(stats.size)}`));

    return { packageFile, archiveTime };
}

async function uploadPackage(context: BuildContext, packageFile: string, fileContent: Buffer) {
    const url = `${context.githubServerUrl}/api/packages/${context.packageOwner}/generic/${context.packageName}/${context.tag}/${packageFile}`;
    const headers = {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileContent.length.toString(),
        Authorization: `token ${context.githubToken}`,
    };

    if (context.isDryRun) {
        console.log(chalk.yellow("🔍 Dry run: Simulating package upload to Forgejo..."));
        console.log(chalk.blue("🔗 Would upload to:"), url);
        console.log(chalk.blue("📊 File size:"), formatBytes(fileContent.length));
        return 0;
    } else {
        console.log(chalk.yellow("📤 Uploading package to Forgejo..."));
        const uploadStart = Date.now();
        try {
            const response = await fetch(url, {
                method: "PUT",
                headers: headers,
                body: fileContent,
            });

            console.log(chalk.blue(`🔢 Response status code: ${response.status}`));

            const responseData = await response.text();

            console.log(chalk.yellow("----------------------------------------"));
            console.log(chalk.yellow("📄 Response Data:"));
            console.log(chalk.yellow("----------------------------------------"));
            console.log(responseData);
            console.log(chalk.yellow("----------------------------------------"));

            if (response.status < 200 || response.status >= 300) {
                console.log(chalk.red("❌ Upload failed"));
                console.log(
                    chalk.red(`🚨 Error: Upload failed with status code: ${response.status}`),
                );
                process.exit(1);
            }

            const uploadTime = Date.now() - uploadStart;
            console.log(chalk.green(`✅ Package upload completed (${uploadTime}ms)`));
            return uploadTime;
        } catch (error) {
            console.log(chalk.yellow("----------------------------------------"));
            console.log(chalk.red("❌ An error occurred during upload:"));
            console.log(chalk.yellow("----------------------------------------"));
            console.error(error);
            throw error;
        }
    }
}

async function main(): Promise<void> {
    console.log(chalk.blue("🚀 Starting build process..."));
    console.log("----------------------------------------");

    const startTime = Date.now();

    const context = validateAndExtractBuildContext();

    console.log(chalk.blue(`📦 Binary name: ${context.binaryName}`));
    console.log(chalk.green(`🖥️ Architecture: ${context.arch}`));
    console.log("----------------------------------------");

    await checkRustToolchain();
    console.log("----------------------------------------");

    console.log(chalk.blue(`👤 Package owner: ${context.packageOwner}`));
    console.log(chalk.blue(`📦 Package name: ${context.packageName}`));
    console.log(chalk.blue(`🌐 Server URL: ${context.githubServerUrl}`));
    console.log(chalk.blue(`🔑 GitHub Token: ${context.githubToken ? "Set" : "Not set"}`));
    console.log(chalk.blue(`🏷️ Processing tag: ${context.tag}`));

    if (context.isDryRun) {
        console.log(chalk.yellow("⚠️ Performing dry run"));
    }
    console.log("----------------------------------------");

    const buildTime = await buildProject();
    console.log("----------------------------------------");

    const binaryPath = `${context.cargoTargetDir}/release/${context.binaryName}`;
    console.log(chalk.cyan(`📁 Binary file path: ${binaryPath}`));

    if (
        await fs
            .access(binaryPath)
            .then(() => true)
            .catch(() => false)
    ) {
        const stats = await fs.stat(binaryPath);
        console.log(chalk.green(`✅ Binary file exists. Size: ${formatBytes(stats.size)}`));
    } else {
        console.log(chalk.red(`❌ Binary file does not exist at path: ${binaryPath}`));
        process.exit(1);
    }
    console.log("----------------------------------------");

    const { packageFile, archiveTime } = await createPackageArchive(context);
    console.log("----------------------------------------");

    console.log(chalk.yellow("📖 Reading file content..."));
    const readStart = Date.now();
    const fileContent = await fs.readFile(packageFile);
    const readTime = Date.now() - readStart;
    console.log(chalk.green(`✅ File content read successfully (${readTime}ms)`));

    const uploadTime = await uploadPackage(context, packageFile, fileContent);
    console.log("----------------------------------------");

    console.log(chalk.yellow("🧹 Running cargo sweep..."));
    const sweepStart = Date.now();
    await spawnProcess("cargo", ["sweep", "--time", "30"]);
    const sweepTime = Date.now() - sweepStart;
    console.log(chalk.green(`✅ Cargo sweep completed (${sweepTime}ms)`));

    const totalTime = Date.now() - startTime;
    console.log("----------------------------------------");
    console.log(chalk.blue("📊 Summary:"));
    console.log(chalk.cyan(`🔨 Build time: ${buildTime}ms`));
    console.log(chalk.cyan(`📦 Archive creation time: ${archiveTime}ms`));
    console.log(chalk.cyan(`📖 File read time: ${readTime}ms`));
    if (!context.isDryRun) {
        console.log(chalk.cyan(`📤 Upload time: ${uploadTime}ms`));
    }
    console.log(chalk.cyan(`🧹 Sweep time: ${sweepTime}ms`));
    console.log(chalk.green(`⏱️ Total execution time: ${totalTime}ms`));
    console.log("----------------------------------------");
    console.log(chalk.blue("🎉 Build process completed successfully!"));
}

main().catch((error: Error) => {
    console.log(chalk.red("An error occurred:"));
    console.error(error);
    process.exit(1);
});
