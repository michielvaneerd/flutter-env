const utils = require('./utils');

exports.exit = function (message, exitCode = 1) {
    if (exitCode === 0) {
        console.log(message);
    } else {
        console.error(`ERROR: ${message}`);
    }
    process.exit(exitCode);
};

exports.getEnvAppendedFile = function (file, env) {
    const index = file.lastIndexOf('.');
    return file.substring(0, index) + `_${env}` + file.substring(index);
};

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

exports.checkEnvJson = function (json) {
    const requiredJsonFields = ['app_id', 'env_file', 'env_class', 'env'];
    const requiredJsonEnvFields = ['value', 'type'];
    const defaultJson = ('default' in json) ? json.default : {};
    for (let envName in json) {
        if (envName === 'default') {
            continue;
        }
        const mergedJson = realMerge(defaultJson, json[envName]);
        for (const key of requiredJsonFields) {
            if (!(key in mergedJson)) {
                utils.exit(`The '${key}' field is missing in the '${envName}' environment.`);
            }
        }
        for (const key in mergedJson.env) {
            for (const subKey of requiredJsonEnvFields) {
                if (!(subKey in mergedJson.env[key])) {
                    utils.exit(`The '${subKey}' field is missing in the '${key}' field of the '${envName}' environment.`);
                }
                if (subKey === 'type' && !['int', 'String', 'bool', 'double'].includes(mergedJson.env[key].type)) {
                    utils.exit(`Wrong type ${mergedJson.env[key].type} for key ${subKey} in the ${key} field of ${envName} JSON.`);
                }
            }
        }
    }
}

exports.realMerge = realMerge;