# actions-send-status

This GitHub Action helps you send the status back to your buildinbblock-run in meshStack.

Before using this action, set up authentication to Meshstack with the [meshcloud/actions-register-source](https://github.com/meshcloud/actions-register-source) action. This action logs in to Meshstack and registers the source of the run.

## Overview


The meshStack Building Block pipeline allows you to automate and manage complex workflows by defining a series of steps that need to be executed. Each Building Block Run represents an instance of such a workflow. This GitHub Action helps you send the status of a step back to the registered source in the meshStack Building Block pipeline.

In order to return updates for a run to meshStack, you first need to register one or multiple steps and their resources of your run execution. It is up to you how many or how you organize your steps. You can, however, also just send step results back and the registration takes place on the fly. But in order to have a consistent display and ordering of steps, it is highly advised to pre-register steps and sources.

Before you can use this action, you need to use [actions-register-source](https://github.com/meshcloud/actions-register-source) to register the source.


For more details on the meshBuildingBlockRun API, refer to the [meshcloud API documentation](https://docs.meshcloud.io/api/index.html#mesh_buildingblockrun).

For more information on integrating with the meshStack Building Block pipeline, refer to the [meshStack Building Block pipeline integration documentation](https://docs.meshcloud.io/docs/meshstack.building-pipeline-integration.html#building-block-run-and-steps).

## Building Block Run and Steps

In meshStack, the execution of a Building Block from beginning till end is called a run. A run can have multiple steps. You have complete freedom about the granularity of information you share with your users.

## Available States for Runs and Steps

meshStack comes with some defined statuses for Building Block runs and steps that provide users insights about the current situation. You can use them as you see fit. Available statuses are:

- **IN_PROGRESS**: When a Building Block run has been started and is in progress
- **SUCCEEDED**: When a Building Block run or step has been successfully completed
- **FAILED**: When a Building Block run or step has failed to complete
- **PENDING**: When a Building Block run has been started but is waiting for an external system

Whenever a run was successful but meshStack did not receive a success for one or more steps, meshStack shows a warning to the operator and user.

## Operator and User Messages

Besides a status, meshStack can also show custom user messages consuming the service and operator messages to the provider of the pipline run inside of meshStack. This can be used to provide more detailed information about the current state of the run.

### inputs:
- `step_id`: (required) The ID of the step
- `status`: (required) The status of the step (SUCCEEDED or FAILED)
- `user_message`: (optional) The user message for a failed step
- `system_message`: (optional) The system message for a failed step
- `is_final`: (optional) Indicates if this is the final status report (default: 'false')
- `summary`: (optional) The summary message for the final status report

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
    status: ${{ steps.terraform-validate.outcome == 'success' && 'SUCCEEDED' || 'FAILED' }} 
    user_message: ${{ steps.terraform-validate.outcome == 'success' && 'Successful plan Terraform configuration.' || 'Failed to plan Terraform configuration.' }}
    system_message:  ${{ steps.terraform-validate.outcome == 'success' && 'Successful plan Terraform configuration.' || 'Failed to plan Terraform configuration.' }}
```
