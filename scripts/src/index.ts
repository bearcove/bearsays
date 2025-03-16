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

async function main(): Promise<void> {
    console.log(chalk.blue("🚀 Starting build process..."));
    console.log("----------------------------------------");

    const startTime = Date.now();

    // Required environment variables
    const requiredEnvVars = ["CARGO_TARGET_DIR", "ARCH", "BINARY_NAME"];

    // Validate required environment variables
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.log(chalk.red(`❌ Error: ${envVar} is not set.`));
            process.exit(1);
        }
    }

    const CARGO_TARGET_DIR = process.env.CARGO_TARGET_DIR!;
    const ARCH = process.env.ARCH!;
    const BINARY_NAME = process.env.BINARY_NAME!;

    // Validate ARCH
    const validArchs = ["aarch64-apple-darwin", "x86_64-unknown-linux-gnu"];
    if (!validArchs.includes(ARCH)) {
        console.log(chalk.red(`❌ Unsupported architecture: ${ARCH}`));
        process.exit(1);
    }

    console.log(chalk.blue(`📦 Binary name: ${BINARY_NAME}`));
    console.log(chalk.green(`🖥️ Architecture: ${ARCH}`));
    console.log("----------------------------------------");

    // Validate toolchains

    console.log(chalk.yellow("🔍 Checking Rust toolchain versions..."));
    await spawnProcess("rustc", ["--version"]);
    await spawnProcess("cargo", ["--version"]);
    await spawnProcess("cargo", ["sweep", "--version"]);
    console.log(chalk.green("✅ Rust toolchain versions checked"));
    console.log("----------------------------------------");

    // Decide important values
    let isDryRun = false;

    let PACKAGE_OWNER = process.env.GITHUB_REPOSITORY_OWNER || "pkgowner";
    console.log(chalk.blue(`👤 Package owner: ${PACKAGE_OWNER}`));
    if (PACKAGE_OWNER === "pkgowner") {
        isDryRun = true;
        console.log(chalk.yellow("⚠️ Using placeholder package owner. Forcing dry run."));
    }

    let PACKAGE_NAME = process.env.GITHUB_REPOSITORY?.split("/")[1] || "pkgname";
    console.log(chalk.blue(`📦 Package name: ${PACKAGE_NAME}`));
    if (PACKAGE_NAME === "pkgname") {
        isDryRun = true;
        console.log(chalk.yellow("⚠️ Using placeholder package name. Forcing dry run."));
    }

    let GITHUB_SERVER_URL = process.env.GITHUB_SERVER_URL || "https://example.com";
    console.log(chalk.blue(`🌐 Server URL: ${GITHUB_SERVER_URL}`));
    if (GITHUB_SERVER_URL === "https://example.com") {
        isDryRun = true;
        console.log(chalk.yellow("⚠️ Using placeholder server URL. Forcing dry run."));
    }

    let GITHUB_TOKEN = process.env.GITHUB_TOKEN || "placeholder_token";
    console.log(chalk.blue(`🔑 GitHub Token: ${GITHUB_TOKEN ? "Set" : "Not set"}`));
    if (GITHUB_TOKEN === "placeholder_token") {
        isDryRun = true;
        console.log(chalk.yellow("⚠️ Using placeholder GitHub token. Forcing dry run."));
    }

    let TAG: string;

    console.log(chalk.yellow("🔨 Building the project..."));
    const buildStart = Date.now();
    await spawnProcess("cargo", ["build", "--verbose", "--release"]);
    const buildTime = Date.now() - buildStart;
    console.log(chalk.green(`✅ Build completed successfully (${buildTime}ms)`));
    console.log("----------------------------------------");

    if (process.env.GITHUB_REF && process.env.GITHUB_REF.startsWith("refs/tags/")) {
        TAG = process.env.GITHUB_REF.replace("refs/tags/", "");
        console.log(chalk.blue(`🏷️ Processing tag: ${TAG}`));
    } else {
        TAG = "vX.Y.Z";
        isDryRun = true;
        console.log(chalk.yellow(`⚠️ No tag detected. Performing dry run with tag: ${TAG}`));
    }

    const binaryPath = `${CARGO_TARGET_DIR}/release/${BINARY_NAME}`;
    console.log(chalk.cyan(`📁 Binary file path: ${binaryPath}`));

    if (
        await fs
            .access(binaryPath)
            .then(() => true)
            .catch(() => false)
    ) {
        const stats = await fs.stat(binaryPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(chalk.green(`✅ Binary file exists. Size: ${sizeInMB} MB`));
    } else {
        console.log(chalk.red(`❌ Binary file does not exist at path: ${binaryPath}`));
        process.exit(1);
    }
    console.log("----------------------------------------");

    const PACKAGE_FILE = `${ARCH}.tar.xz`;
    console.log(chalk.cyan(`📦 Package file name: ${PACKAGE_FILE}`));

    console.log(chalk.yellow("📦 Creating package archive..."));
    const archiveStart = Date.now();
    await spawnProcess("tar", [
        "-cJvf",
        PACKAGE_FILE,
        "-C",
        `${CARGO_TARGET_DIR}/release`,
        BINARY_NAME,
    ]);
    const archiveTime = Date.now() - archiveStart;
    console.log(chalk.green(`✅ Package archive created successfully (${archiveTime}ms)`));

    console.log(chalk.yellow("📋 Showing contents of the archive..."));
    await spawnProcess("tar", ["wtf", PACKAGE_FILE]);

    const stats = await fs.stat(PACKAGE_FILE);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(chalk.green(`📊 Archive size: ${sizeInMB} MB`));
    console.log("----------------------------------------");

    console.log(chalk.yellow("📖 Reading file content..."));
    const readStart = Date.now();
    const fileContent = await fs.readFile(PACKAGE_FILE);
    const readTime = Date.now() - readStart;
    console.log(chalk.green(`✅ File content read successfully (${readTime}ms)`));

    const url = `${GITHUB_SERVER_URL}/api/packages/${PACKAGE_OWNER}/generic/${PACKAGE_NAME}/${TAG}/${PACKAGE_FILE}`;
    const headers = {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileContent.length.toString(),
        Authorization: `token ${GITHUB_TOKEN}`,
    };

    let uploadTime = 0;
    if (isDryRun) {
        console.log(chalk.yellow("🔍 Dry run: Simulating package upload to Forgejo..."));
        console.log(chalk.blue("🔗 Would upload to:"), url);
        console.log(chalk.blue("📊 File size:"), fileContent.length, "bytes");
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
            process.stdout.write(responseData);

            uploadTime = Date.now() - uploadStart;
            console.log(chalk.green(`✅ Package upload completed (${uploadTime}ms)`));
        } catch (error) {
            console.log(chalk.red("❌ An error occurred during upload:"));
            console.error(error);
            throw error;
        }
    }
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
    if (!isDryRun) {
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
