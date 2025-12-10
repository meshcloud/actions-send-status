# meshStack Send Status Action

This GitHub Action sends building block run step status updates back to meshStack. It integrates with the meshStack API 
to provide rich feedback about step execution to application teams.

Before using this action, set up authentication to meshStack with the [meshcloud/actions-meshstack-auth](https://github.com/meshcloud/actions-meshstack-auth) action and register your workflow as a source with [meshcloud/actions-register-source](https://github.com/meshcloud/actions-register-source). We recommend you pre-register all steps that your workflow will execute
to improve user experience for your application teams.

## Overview

This action allows you to send updates to pre-registered steps or create new steps on the fly.

## Related Actions

This action is part of a suite of GitHub Actions for meshStack building block automation:

- **[actions-meshstack-auth](https://github.com/meshcloud/actions-meshstack-auth)** - Authenticates to the meshStack API (prerequisite for this action)
- **[actions-register-source](https://github.com/meshcloud/actions-register-source)** - Registers building block sources and steps with meshStack (prerequisite for this action)
- **[actions-send-status](https://github.com/meshcloud/actions-send-status)** (this action) - Sends building block step status updates to meshStack

## Documentation

For more information about meshStack building blocks and GitHub Actions integration, refer to:
- [meshStack GitHub Actions Integration](https://docs.meshcloud.io/integrations/github/github-actions/)
- [meshStack API Documentation](https://docs.meshcloud.io/api/index.html#mesh_buildingblockrun)

## Building Block Run and Steps

In meshStack, the execution of a building block from beginning till end is called a run. A run can have multiple steps. You have complete freedom about the granularity of information you share with your users.

## Available States for Runs and Steps

meshStack comes with some defined statuses for building block runs and steps that provide users insights about the current situation. You can use them as you see fit. Available statuses are:

- **IN_PROGRESS**: When a building block run has been started and is in progress
- **SUCCEEDED**: When a building block run or step has been successfully completed
- **FAILED**: When a building block run or step has failed to complete
- **PENDING**: When a building block run has been started but is waiting for an external system

Whenever a run was successful but meshStack did not receive a success for one or more steps, meshStack shows a warning to the operator and user.

## Operator and User Messages

Besides a status, meshStack can also show custom user messages consuming the service and operator messages to the provider of the pipeline run inside of meshStack. This can be used to provide more detailed information about the current state of the run.

## Inputs
- `step_id` (required): The ID of the step to update
- `step_status` (required): The status of the step - `IN_PROGRESS`, `SUCCEEDED`, or `FAILED`
- `user_message` (optional): A message shown to users consuming the service
- `system_message` (optional): A message shown to operators/providers of the pipeline run
- `outputs_json` (optional): A JSON object with outputs of the step. All step outputs in a run will be merged by meshStack to produce the run outputs. See the [API documentation](https://docs.meshcloud.io/api/index.html#_update_sources_and_steps) for more details on how to use this field.
- `run_status` (optional): The final status of the run (`SUCCEEDED` or `FAILED`). Send this only once to signal to meshStack that the run is complete and you will not send further step updates.

## Required GitHub Context Parameters

This action requires the meshStack workflow trigger parameters to be present in the GitHub event payload:

- `buildingBlockRunUrl` (required): URL to fetch the building block run object from the meshStack API
- `buildingBlockRun` (optional, legacy): Base64-encoded building block run object (alternative to `buildingBlockRunUrl`)

These parameters are automatically provided by meshStack when it triggers your workflow via `workflow_dispatch`.

## Example Usage

```yaml
name: Deploy Building Block

on:
  workflow_dispatch:
    inputs:
      buildingBlockRunUrl:
        description: "URL to fetch the Building Block Run Object from"
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup meshStack auth
        id: setup-meshstack-auth
        uses: meshcloud/actions-meshstack-auth@v2
        with:
          base_url: ${{ vars.MESHSTACK_BASE_URL }}
          client_id: ${{ vars.BUILDINGBLOCK_API_CLIENT_ID }}
          key_secret: ${{ secrets.BUILDINGBLOCK_API_KEY_SECRET }}

      - name: Register building block source
        id: register-source
        uses: meshcloud/actions-register-source@v2
        with:
          steps: |
            [
              { "id": "terraform-validate", "displayName": "Terraform Validate" }
            ]

      - name: update run step terraform-validate in-progress
        uses: meshcloud/actions-send-status@v2
        with:
          step_id: terraform-validate
          status: IN_PROGRESS

      - name: Terraform validate
        id: terraform-validate
        run: terraform validate

      - name: update run step terraform-validate result
        if: always()
        uses: meshcloud/actions-send-status@v2
        with:
          step_id: terraform-validate
          step_status: ${{ steps.terraform-validate.outcome == 'success' && 'SUCCEEDED' || 'FAILED' }}
          user_message: ${{ steps.terraform-validate.outcome == 'success' && 'Successfully validated Terraform configuration.' || 'Failed to validate Terraform configuration.' }}
          # also mark the run completed
          run_status: ${{ steps.terraform-validate.outcome == 'success' && 'SUCCEEDED' || 'FAILED' }}
```


