# Entity Manager

Entity metadata service, intended to manage:
- Name
- Census remote control
- Processes
- Feed
- Relays
- Avatar, etc

# Deployment

Grab the files from the GitLab artifacts archive and uplad them:

```sh
GITLAB_API_ACCESS_TOKEN=...
PROJECT_ID=11398198
JOB_ID=....

curl --output entity-manager.zip --location --header "PRIVATE-TOKEN: $GITLAB_API_ACCESS_TOKEN" "https://gitlab.com/api/v4/projects/$PROJECT_ID/jobs/$JOB_ID/artifacts"

scp entity-manager.zip root@host:folder
```
