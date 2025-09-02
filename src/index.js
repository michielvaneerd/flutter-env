const fs = require('fs');
const helpText = require('./helpText');
const utils = require('./utils');
const flutterEnvExample = require('./flutter-env-example');
const flutterEnvJsonFile = 'flutter-env.json';

// Help?
if (process.argv.length <= 2 || ['-h', '--help'].includes(process.argv[2])) {
    utils.exit(helpText, 0);
}

if (!fs.existsSync('pubspec.yaml')) {
    utils.exit('You are not in the root of a Flutter project.');
}

if (process.argv.length < 3) {
    utils.exit('Command is missing.');
}

const command = process.argv[2];
let isSwitchTo = false;

/**
 * New environment key in JSON file.
 */
let envTo = null;

/**
 * New environment name (bu default will be the same of the envTo variable, but can be overruled in the JSON file)
 */
let envToName = null;

switch (command) {
    case 'switch-to':
        // flutter-env switch-to $env [--with-fb]
        if (process.argv.length < 4) {
            utils.exit('Environment argument missing.');
        }
        envTo = process.argv[3];
        envToName = envTo;
        isSwitchTo = true;
        break;
    case 'flutter-env-example':
        return utils.exit(JSON.stringify(flutterEnvExample, null, 2), 0);
    case 'list':
        // List the environment names with the current one with a *
        break;
    case 'check':
        // flutter-env check [--with-fb]
        break;
    default:
        return utils.exit('Unknown command.');
}

if (!fs.existsSync('.flutter-env')) {
    utils.exit('The .flutter-env file is missing. Create this file with the current environment name in it.');
}

if (!fs.existsSync(flutterEnvJsonFile)) {
    utils.exit(`The ${flutterEnvJsonFile} file is missing. Create this JSON file with the following content (replace the example content in it with the actual values):

${JSON.stringify(flutterEnvExample, null, 2)}`);
}

/**
 * JSON object of the flutter-env.json file.
 */
let envJson = null;
try {
    envJson = JSON.parse(fs.readFileSync(flutterEnvJsonFile, 'utf8'));
} catch (ex) {
    utils.exit(ex.toString());
}

/**
 * Current environment name.
 */
const envFrom = fs.readFileSync('.flutter-env', 'utf8').trim();
let envFromName = envFrom;

/**
 * Whether Firebase files should also be switched.
 */
const withFirebase = process.argv.includes('--with-fb');

if (isSwitchTo) {
    if (!(envFrom in envJson)) {
        utils.exit(`Current environment ${envFrom} is missing in the ${flutterEnvJsonFile} file.`);
    }
    if (!(envTo in envJson)) {
        utils.exit(`New environment ${envTo} is missing in the ${flutterEnvJsonFile} file.`);
    }
}

// Check the JSON env file and update the envToName if present.
utils.checkEnvJson(envJson);

if (command === 'list') {
    utils.exit(Object.keys(envJson).map(function (env) {
        if (env === envFrom) {
            return `${env} *`;
        } else {
            return env;
        }
    }).join("\n"), 0);
}

/**
 * JSON object of the new environment.
 */
let envToJson = isSwitchTo ? utils.realMerge(envJson.default, envJson[envTo]) : null;
if (envToJson) {
    if ('env_name' in envToJson) {
        envToName = envToJson['env_name'];
    }
}

/**
 * JSON object of the current environment.
 */
let envFromJson = isSwitchTo ? utils.realMerge(envJson.default, envJson[envFrom]) : null;
if (envFromJson) {
    if ('env_name' in envFromJson) {
        envFromName = envFromJson['env_name'];
    }
}

/**
 * New app id.
 */
const appIdTo = isSwitchTo ? envToJson.app_id : null;

/**
 * Firebase files that should be switched.
 */
const fbFiles = [
    'android/app/google-services.json',
    'ios/firebase_app_id_file.json',
    'ios/Runner/GoogleService-Info.plist',
    'lib/firebase_options.dart'
];

if (withFirebase) {
    // First check if we have all Firebase files.
    for (const file of fbFiles) {
        if (!fs.existsSync(file)) {
            utils.exit(`Missing original firebase file ${file}.`);
        }
        const fromFile = utils.getEnvAppendedFile(file, envFromName);
        if (!fs.existsSync(fromFile)) {
            utils.exit(`Missing firebase file ${fromFile}.`);
        }
        const toFile = utils.getEnvAppendedFile(file, envToName);
        if (!fs.existsSync(toFile)) {
            utils.exit(`Missing firebase file ${toFile}.`);
        }
    }

    if (isSwitchTo) {
        // Now copy the contents of the new Firebase files to the actual Firebase files.
        for (const file of fbFiles) {
            try {
                const toFile = utils.getEnvAppendedFile(file, envToName);
                fs.copyFileSync(`${toFile}`, `${file}`);
            } catch (ex) {
                utils.exit(ex.toString());
            }
        }
    }
}

// Write the environment Dart class file. This file contains the constants that come from the flutter-env.json file.
// For example API endpoints and other things that change between environments.
if (isSwitchTo) {
    let contentEnvFile = [`class ${envToJson.env_class} {`];
    for (const key in envToJson.env) {
        const item = envToJson.env[key];
        let valueRaw = item.value;
        if (item.type === 'String') {
            valueRaw = `"${valueRaw}"`;
        }
        contentEnvFile.push(`\tstatic const ${key} = ${valueRaw};`);
    }
    contentEnvFile.push('}');
    try {
        fs.writeFileSync(`lib/${envToJson.env_file}`, contentEnvFile.join("\n"));
    } catch (ex) {
        utils.exit(ex.toString());
    }

    // Replace the app ids.
    const appIdFiles = [
        {
            path: 'android/app/build.gradle',
            reg: /applicationId "(.+)"/g, // applicationId "my.app.com"
            replace: `applicationId "${appIdTo}"`,
        },
        {
            path: 'android/app/build.gradle.kts',
            reg: /applicationId = "(.+)"/g, // applicationId "my.app.com"
            replace: `applicationId = "${appIdTo}"`,
        },
        {
            path: 'ios/Runner.xcodeproj/project.pbxproj',
            reg: /PRODUCT_BUNDLE_IDENTIFIER = (.+);/g, // PRODUCT_BUNDLE_IDENTIFIER = my.app.com;
            replace: `PRODUCT_BUNDLE_IDENTIFIER = ${appIdTo};`,
        }
    ];
    for (let file of appIdFiles) {
        if (!fs.existsSync(file.path)) {
            continue;
        }
        try {
            if (fs.existsSync(`${file.path}.tmp`)) {
                utils.exit(`File ${file.path}.tmp already exists. First remove it before running this.`);
            }
            const newData = fs.readFileSync(`./${file.path}`, 'utf8').replace(file.reg, function () {
                return file.replace;
            });
            fs.writeFileSync(`${file.path}.tmp`, newData);
        } catch (ex) {
            utils.exit(ex.toString());
        }
    }
    // All app ids have been set, now move the tmp files to the actual files.
    for (let file of appIdFiles) {
        if (!fs.existsSync(file.path)) {
            continue;
        }
        try {
            fs.renameSync(`${file.path}.tmp`, `${file.path}`);
        } catch (ex) {
            utils.exit(ex.toString());
        }
    }

    // At last write down the new environment to the .flutter-env file
    fs.writeFileSync('.flutter-env', envTo);
}

console.log(`COMPLETED!`);
