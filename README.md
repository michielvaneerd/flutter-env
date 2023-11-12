# flutter-env

Switch between different Firebase projects in your Flutter app.

For example you have a development and production environment that uses 2 different Firebase projects that also have different app ids.

## Installation

Install this packages globally:

`npm i -g flutter-env`

## Preparation

To add 2 Firebase projects to your Flutter app, these are the steps:

1. Create the fb-env.json file
2. Add the first Firebase project
3. Append the Firebase files with the environment name
4. Add the second Firebase project
5. Append the Firebase files with the environment name
6. Commit your changes
7. Now you can use this script to switch between environments and Firebase projects with one command

Now add the Firebase environments to your Flutter project.

### Create the fb-env.json file

This file maps your environment name to the app id. The environment name can be anything.

```json
{
    "dev": "my.app.dev",
    "test": "my.app.test",
    "prod": "my.app.prod",
    "prod1": "my.app.prod1"
}
```

### Add the first Firebase project

Execute the flutterfire command.

`flutterfire configure`

This will add the following files to your Flutter project:

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

Execute the following flutterfire command:

`flutterfire configure -p [project-name] -i [app-id] -a [app-id]`

The -i and -a are the app ids of the iOS and Android app.

### Append the Firebase files with the environment name

Now move these 4 files and add _[environment] to it. For example if this is the `prod` environment, the files will become:

- android/app/google-services_prod.json
- ios/firebase_app_id_file_prod.json
- ios/Runner/GoogleService-Info_prod.plist
- lib/firebase_options_prod.dart

### Commit your changes

Now commit your files, so we have all files.

## Switch between environments

Just give the following command. For example if we want to go from the dev to the prod environment:

`flutter-env prod dev`

