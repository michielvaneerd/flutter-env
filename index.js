const fs = require('fs');

function exit(message) {
    console.error(message);
    process.exit(1);
}

function getEnvAppendedFile(file, env) {
    const index = file.lastIndexOf('.');
    return file.substring(0, index) + `_${env}` + file.substring(index);
}

function realMerge(to, from) {
    to = { ...to };
    from = { ...from };
    for (n in from) {
        if (typeof to[n] !== 'object') {
            to[n] = from[n];
        } else if (typeof from[n] === 'object') {
            to[n] = realMerge(to[n], from[n]);
        }
    }
    return to;
};

// Start 'help'
if (['-h', '--help'].includes(process.argv[2])) {
    const helpText = `
This script switches between environments. Make sure to add a 'flutter-env.json' file to the root of the Flutter project that maps the 'env' name to the app id.

Usage:

flutter-env [env] --with-fb
    Switches to this environment
    - env: new environment
    - --with-fb: with firebase
    
flutter-env -h
    Displays this help text
`;
    console.log(helpText);
    process.exit(0);
}
// End 'help'

// Make sure we are in the root of the Flutter project
if (!fs.existsSync('pubspec.yaml')) {
    exit(`You are not in the root directory.`);
}

if (!fs.existsSync('.flutter-env')) {
    exit('File .flutter-env missing');
}

let envJson = null;
try {
    envJson = JSON.parse(fs.readFileSync(`flutter-env.json`, 'utf8'));
} catch (ex) {
    exit(ex.toString());
}

if (process.argv.length < 3) {
    exit('Missing environment argument');
}

const envFrom = fs.readFileSync('.flutter-env', 'utf8').trim();
const envTo = process.argv[2];
const withFirebase = process.argv.includes('--with-fb');

// Check if env exists in env json
if (!(envFrom in envJson)) {
    exit(`Current environment ${envFrom} missing in flutter-env.json file`);
}
if (!(envTo in envJson)) {
    exit(`New environment ${envTo} missing in flutter-env.json file`);
}

// Merge JSON
let envToJson = realMerge(envJson.default, envJson[envTo]);
let envFromJson = realMerge(envJson.default, envJson[envFrom]);

const appIdTo = envToJson.app_id;
const appIdFrom = envFromJson.app_id;

// Make sure all firebase files are in position
const fbFiles = [
    'android/app/google-services.json',
    'ios/firebase_app_id_file.json',
    'ios/Runner/GoogleService-Info.plist',
    'lib/firebase_options.dart'
];

// Check if we have all files
if (withFirebase) {
    for (const file of fbFiles) {
        // We need to have 3 files: original one, _envFrom and _envTo
        if (!fs.existsSync(file)) {
            exit(`Missing original firebase file ${file}`);
        }
        const fromFile = getEnvAppendedFile(file, envFrom);
        if (!fs.existsSync(fromFile)) {
            exit(`Missing firebase file ${fromFile}`);
        }
        const toFile = getEnvAppendedFile(file, envTo);
        if (!fs.existsSync(toFile)) {
            exit(`Missing firebase file ${toFile}`);
        }
    }

    // Move the from file to the to file
    for (const file of fbFiles) {
        try {
            const toFile = getEnvAppendedFile(file, envTo);
            fs.copyFileSync(`${toFile}`, `${file}`);
        } catch (ex) {
            exit(ex.toString());
        }
    }
}

// Write env file
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
    exit(ex.toString());
}

const appIdFiles = [
    {
        path: 'android/app/build.gradle',
        search: `"${appIdFrom}"`,
        replace: `"${appIdTo}"`,
    },
    {
        path: 'ios/Runner.xcodeproj/project.pbxproj',
        search: `PRODUCT_BUNDLE_IDENTIFIER = ${appIdFrom};`,
        replace: `PRODUCT_BUNDLE_IDENTIFIER = ${appIdTo};`,
    }
];

for (let file of appIdFiles) {
    try {
        if (fs.existsSync(`${file.path}.tmp`)) {
            exit(`File ${file.path}.tmp already exists. First remove it before running this script.`);
        }
        const newData = fs.readFileSync(`./${file.path}`, 'utf8').replaceAll(file.search, file.replace);
        fs.writeFileSync(`${file.path}.tmp`, newData);

    } catch (ex) {
        exit(ex.toString());
    }
}

// If we are here, all is good, now we can move the .tmp files to the actual files.
for (let file of appIdFiles) {
    try {
        fs.renameSync(`${file.path}.tmp`, `${file.path}`);
    } catch (ex) {
        exit(ex.toString());
    }
}

fs.writeFileSync('.flutter-env', envTo);

console.log(`Switching from ${envFrom} to ${envTo} completed`);
