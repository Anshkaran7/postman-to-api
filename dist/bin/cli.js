#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const validator_1 = require("../lib/validator");
const generator_1 = require("../lib/generator");
const program = new commander_1.Command();
program
    .name('postman-to-api')
    .description('Generate API service files from Postman collections')
    .version('1.0.0')
    .argument('<collection>', 'Path to Postman collection JSON file')
    .option('-o, --out <path>', 'Output directory for generated files', './src/api')
    .option('-l, --lang <language>', 'Language: ts or js', 'ts')
    .option('-c, --client <client>', 'HTTP client: axios or fetch', 'axios')
    .option('--no-interactive', 'Skip interactive prompts and use provided options')
    .action(async (collection, options) => {
    try {
        console.log(chalk_1.default.blue('🚀 Postman to API Generator\n'));
        // Validate inputs
        const validationResult = await (0, validator_1.validateInputs)(collection, options);
        if (!validationResult.isValid) {
            console.error(chalk_1.default.red('❌ Validation failed:'));
            validationResult.errors.forEach(error => {
                console.error(chalk_1.default.red(`  • ${error}`));
            });
            process.exit(1);
        }
        let config = {
            collectionPath: collection,
            outputDir: options.out,
            language: options.lang,
            httpClient: options.client,
        };
        // Interactive prompts if not in non-interactive mode
        if (options.interactive) {
            console.log(chalk_1.default.yellow('📝 Configuration:'));
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'language',
                    message: 'Choose language:',
                    choices: [
                        { name: 'TypeScript', value: 'ts' },
                        { name: 'JavaScript', value: 'js' },
                    ],
                    default: config.language,
                },
                {
                    type: 'list',
                    name: 'httpClient',
                    message: 'Choose HTTP client:',
                    choices: [
                        { name: 'Axios', value: 'axios' },
                        { name: 'Fetch API', value: 'fetch' },
                    ],
                    default: config.httpClient,
                },
                {
                    type: 'input',
                    name: 'outputDir',
                    message: 'Output directory:',
                    default: config.outputDir,
                },
            ]);
            config = { ...config, ...answers };
        }
        console.log(chalk_1.default.cyan('\n⚙️  Configuration:'));
        console.log(`  Collection: ${chalk_1.default.white(config.collectionPath)}`);
        console.log(`  Output: ${chalk_1.default.white(config.outputDir)}`);
        console.log(`  Language: ${chalk_1.default.white(config.language.toUpperCase())}`);
        console.log(`  HTTP Client: ${chalk_1.default.white(config.httpClient)}`);
        // Generate API files
        console.log(chalk_1.default.cyan('\n🔄 Generating API files...\n'));
        const result = await (0, generator_1.generateApiFiles)(config);
        console.log(chalk_1.default.green('\n✅ Generation completed successfully!'));
        console.log(chalk_1.default.cyan('\n📁 Generated files:'));
        result.generatedFiles.forEach(file => {
            console.log(`  ${chalk_1.default.green('✓')} ${file}`);
        });
        if (result.warnings.length > 0) {
            console.log(chalk_1.default.yellow('\n⚠️  Warnings:'));
            result.warnings.forEach(warning => {
                console.log(`  ${chalk_1.default.yellow('•')} ${warning}`);
            });
        }
        console.log(chalk_1.default.blue('\n🎉 Ready to use your generated API services!'));
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Error occurred:'));
        if (error instanceof Error) {
            console.error(chalk_1.default.red(error.message));
            if (process.env.DEBUG) {
                console.error(chalk_1.default.gray(error.stack));
            }
        }
        else {
            console.error(chalk_1.default.red('Unknown error occurred'));
        }
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map