# meshStack Send Status Action

This GitHub Action sends building block step status updates back to meshStack.

Before using this action, set up authentication to meshStack with the [meshcloud/actions-meshstack-auth](https://github.com/meshcloud/actions-meshstack-auth) action and register the source with [meshcloud/actions-register-source](https://github.com/meshcloud/actions-register-source).

## Overview

The meshStack building block pipeline allows you to automate and manage complex workflows by defining a series of steps that need to be executed. Each building block run represents an instance of such a workflow. This GitHub Action helps you send the status of a step back to the registered source in the meshStack building block pipeline.

In order to return updates for a run to meshStack, you first need to register one or multiple steps and their resources of your run execution. It is up to you how many or how you organize your steps. You can, however, also just send step results back and the registration takes place on the fly. But in order to have a consistent display and ordering of steps, it is highly advised to pre-register steps and sources.

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
- `step_id`: (required) The ID of the step
- `step_status`: (required) The status of the step (SUCCEEDED or FAILED)
- `user_message`: (optional) The user message for a failed step
- `system_message`: (optional) The system message for a failed step
- `outputs_json`: (optional) A JSON object with outputs of the step. All step outputs in a run will be merged by meshStack to produce the run outputs. See the [API documentation](https://docs.meshcloud.io/api/index.html#_update_sources_and_steps) for more details on how to use this field.
- `run_status`: (optional) Indicates if this is the final status report (default: 'false')


## Example Usage

```yaml
- name: Setup meshStack bbrun
  id: setup-meshstack-auth
  uses: meshcloud/actions-register-source@main
  with:
    client_id: ${{ vars.BUILDINGBLOCK_API_CLIENT_ID }}
    key_secret: ${{ secrets.BUILDINGBLOCK_API_KEY_SECRET }}
    steps: |
      [
        { "id": "terraform-validate", "displayName": "terraform validate" },
        { "id": "terraform-plan", "displayName": "terraform plan" },
        { "id": "terraform-apply", "displayName": "terraform apply" }
      ] 

- name: Terragrunt validate
  id: terraform-validate
  run: terraform validate

- name: Send status on validate
  if: ${{ steps.terraform-validate.outcome == 'success' }}
  uses: meshcloud/actions-send-status@main
  with:
    step_id: "terraform-validate"
    step_status: ${{ steps.terraform-validate.outcome == 'success' && 'SUCCEEDED' || 'FAILED' }} 
    user_message: ${{ steps.terraform-validate.outcome == 'success' && 'Successful plan Terraform configuration.' || 'Failed to plan Terraform configuration.' }}
    system_message:  ${{ steps.terraform-validate.outcome == 'success' && 'Successful plan Terraform configuration.' || 'Failed to plan Terraform configuration.' }}
```


