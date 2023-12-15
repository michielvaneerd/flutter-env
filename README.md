# flutter-env

Switch between different Flutter environments.

Useful if you have multiple environments that all have different app id's, API endpoints and Firebase projects.

## Installation

Install this packages globally:

`npm i -g flutter-env`

## Preparation

1. Create the `flutter-env.json` and `.flutter-env` file in the root of your Flutter project.
2. Run `flutter-env flutter-env-example` to see an example of the `flutter-env.json` file and use this as the base for your file.
3. Commit these files.
4. Run `flutter-env switch-to prod` to switch to the `prod` environment (or some other environment you have defined in the `flutter-env.json` file).

## The flutter-env.json file

This file defines all properties for each environment. The `default` environment must be present defines the default properties and their values. These values can be overruled in the other environments you define. For example below we have defined 3 environments: `dev`, `test` and `prod`. The `dev` environment overrules the `app_id` and some `env` variables. The `test` and `prod` environments only overrule the `app_id`.

### Fields

#### app_id

The app ID.

#### env_file and env_class

All variables that are defined in the `env` section will be written to the file `env_file` as `static const` variables of the `env_class` class. See below for example.

#### env

These are the variables of the `env_class` class in the `env_file` file.

### Example flutter-env.json

```json
{
    "default": {
        "env_file": "my_env.dart",
        "env_class": "MyEnv",
        "env": {
            "apiProtocol": {
                "value": "https",
                "type": "String"
            },
            "apiHost": {
                "value": "www.example.com",
                "type": "String"
            },
            "sentryDns": {
                "value": "https://sentry.com",
                "type": "String"
            }
        }
    },
    "dev": {
        "app_id": "my.dev.app",
        "env": {
            "apiProtocol": {
                "value": "http"
            },
            "apiHost": {
                "value": "localhost:8080"
            }
        }
    },
    "test": {
        "app_id": "my.test.app"
    },
    "prod": {
        "app_id": "my.prod.app"
    }
}
```

### Resulting env Dart class file

With the above file, we get the following Dart file `my_env.dart` if we give the command `flutter-env switch-to prod`:

```dart
class MyEnv {
	static const env = "prod";
	static const apiProtocol = "https";
	static const apiHost = "www.example.com";
    static const sentryDns = "https://sentry.com";
}
```

After the command `flutter-env switch-to dev` we get:

```dart
class MyEnv {
	static const env = "dev";
	static const apiProtocol = "http";
	static const apiHost = "localhost:8080";
    static const sentryDns = "https://sentry.com";
}
```

## Firebase

If you want to use multiple Firebase projects for your environments, first follow the steps below. After that you can add the `with-fb` option to the `switch-to` command.

### Add the first Firebase project

Execute the `flutterfire configure` command. This will add the following files to your Flutter project:

- android/app/google-services.json
- ios/firebase_app_id_file.json
- ios/Runner/GoogleService-Info.plist
- lib/firebase_options.dart

### Append the Firebase files with the environment name

Now move these 4 files and add _[environment] to it. For example if this is the `dev` environment, the files will become:

- android/app/google-services_dev.json
- ios/firebase_app_id_file_dev.json
- ios/Runner/GoogleService-Info_dev.plist
- lib/firebase_options_dev.dart

### Add the second Firebase project

Execute the following flutterfire command: `flutterfire configure -p [project-name] -i [app-id] -a [app-id]`. The -i and -a are the app ids of the iOS and Android app. This will add again the 4 files to your Flutter project.

### Append the Firebase files with the environment name

Now move these 4 files and add _[environment] to it. For example if this is the `prod` environment, the files will become:

- android/app/google-services_prod.json
- ios/firebase_app_id_file_prod.json
- ios/Runner/GoogleService-Info_prod.plist
- lib/firebase_options_prod.dart

### Commit your changes

Now commit your files, so we have all files.

## Commands

### `flutter-env check`

A basic check if you have the required files.

### `flutter-env switch-to`

Switch to a specific environment.

For example to switch to the `dev` environment:

`flutter-env switch-to dev`

Or switch to the `myprod` environment:

`flutter-env switch-to myprod`

If you have set up Firebase as well, you need to aff the `with-fb` option:

`flutter-env switch-to myprod --with-fb`

### `flutter-env list`

Lists the environments from the `flutter-env.json` file and prepend the current environment with a *.

### `flutter-env -h`

Prints help message.

### `flutter-env flutter-env-example`

Prints an example `flutter-env.json` file.