module.exports = {
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
    "dev-android": {
        "env_name": "dev",
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
};