#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';

import { CLIOptions, GeneratorConfig } from '../lib/types';
import { validateInputs } from '../lib/validator';
import { generateApiFiles } from '../lib/generator';

const program = new Command();

program
  .name('postman-to-api')
  .description('Generate API service files from Postman collections')
  .version('1.0.0')
  .argument('<collection>', 'Path to Postman collection JSON file')
  .option(
    '-o, --out <path>',
    'Output directory for generated files',
    './src/api'
  )
  .option('-l, --lang <language>', 'Language: ts or js', 'ts')
  .option('-c, --client <client>', 'HTTP client: axios or fetch', 'axios')
  .option(
    '--no-interactive',
    'Skip interactive prompts and use provided options'
  )
  .action(async (collection: string, options: CLIOptions) => {
    try {
      console.log(chalk.blue('🚀 Postman to API Generator\n'));

      // Validate inputs
      const validationResult = await validateInputs(collection, options);
      if (!validationResult.isValid) {
        console.error(chalk.red('❌ Validation failed:'));
        validationResult.errors.forEach(error => {
          console.error(chalk.red(`  • ${error}`));
        });
        process.exit(1);
      }

      let config: GeneratorConfig = {
        collectionPath: collection,
        outputDir: options.out,
        language: options.lang as 'ts' | 'js',
        httpClient: options.client as 'axios' | 'fetch',
      };

      // Interactive prompts if not in non-interactive mode
      if (options.interactive) {
        console.log(chalk.yellow('📝 Configuration:'));
        const answers = await inquirer.prompt([
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

      console.log(chalk.cyan('\n⚙️  Configuration:'));
      console.log(`  Collection: ${chalk.white(config.collectionPath)}`);
      console.log(`  Output: ${chalk.white(config.outputDir)}`);
      console.log(`  Language: ${chalk.white(config.language.toUpperCase())}`);
      console.log(`  HTTP Client: ${chalk.white(config.httpClient)}`);

      // Generate API files
      console.log(chalk.cyan('\n🔄 Generating API files...\n'));
      const result = await generateApiFiles(config);

      console.log(chalk.green('\n✅ Generation completed successfully!'));
      console.log(chalk.cyan('\n📁 Generated files:'));
      result.generatedFiles.forEach(file => {
        console.log(`  ${chalk.green('✓')} ${file}`);
      });

      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        result.warnings.forEach(warning => {
          console.log(`  ${chalk.yellow('•')} ${warning}`);
        });
      }

      console.log(chalk.blue('\n🎉 Ready to use your generated API services!'));
    } catch (error) {
      console.error(chalk.red('\n❌ Error occurred:'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
        if (process.env.DEBUG) {
          console.error(chalk.gray(error.stack));
        }
      } else {
        console.error(chalk.red('Unknown error occurred'));
      }
      process.exit(1);
    }
  });

program.parse();
