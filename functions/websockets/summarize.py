import json
import logging
import os
import time
import uuid
import boto3
from botocore.client import Config


# Initialize the logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

STEP_FUNCTION_ARN = os.getenv("StepFunctionArn")
config = Config(read_timeout=1000)
sfn_client = boto3.client('stepfunctions', config=config)

# Initialize the queue
QUEUE_URL = os.getenv("PodcastQueueUrl")
sqs = boto3.client('sqs')


def lambda_handler(event, context):
    logger.info(event)
    transactionID = str(uuid.uuid1())

    # Extract request inputs
    body = str(event["body"])
    logger.info(f"body:{body}")
    prompt = json.loads(body)['prompt']
    logger.info(f"prompt:{prompt}")
    connectionId = event["requestContext"]["connectionId"]
    PUBLISH_URL = "https://" + str(event["requestContext"]["domainName"]) + "/" + str(event["requestContext"]["stage"])
    logger.info(f"Publish URL:{PUBLISH_URL}")

    apigw_client = boto3.client('apigatewaymanagementapi', endpoint_url=PUBLISH_URL)

    # Invoke the step function workflow
    logger.info(f"StepFunctionArn:{STEP_FUNCTION_ARN}")
    input = {'TransactionId': transactionID, 'connectionId': connectionId, 'publishUrl': PUBLISH_URL, 'prompt': prompt}
    try:
        summary = sfn_client.start_execution(
            stateMachineArn=STEP_FUNCTION_ARN,
            name=transactionID,
            input=json.dumps(input)
        )

        # Get the result from Queue
        #time.sleep(10)
        #response = sqs.receive_message(
        #    QueueUrl=QUEUE_URL,
        #    MaxNumberOfMessages=1,
        #    WaitTimeSeconds=10,
        #    MessageAttributeNames=['All']
        #)
        #logger.info("Response from SQS:", response)
        #for message in response.get("Messages", []):
            #message_body = message["Body"]
        # Get the message from the response
        #message = response.get('Messages', [])[0]
        #logger.info("Summary:", message.get('Body'))

        max_tries = 60
        while max_tries > 0:
            max_tries -= 1
            job = sfn_client.describe_execution(executionArn=summary["executionArn"])
            job_status = job['status']
            logger.info(f"Job status is {job_status}.")
            job_name = job['name']
            logger.info(f"Job name is {job_name}.")
            if job_status in ['SUCCEEDED', 'FAILED']:
                logger.info(f"Job {job_name} is {job_status}.")
                if job_status == 'SUCCEEDED':
                    logger.info(f"Job is running")
                    message = {"status": "Summarization Complete"}
                    response = apigw_client.post_to_connection(ConnectionId=connectionId,
                                                               Data=json.dumps(message).encode('utf-8'))
                elif job_status == 'FAILED':
                    logger.info(f"Job has failed")
                    message = {"status": "Summarization Failed"}
                    response = apigw_client.post_to_connection(ConnectionId=connectionId,
                                                               Data=json.dumps(message).encode('utf-8'))
                break
            else:
                logger.info(f"Waiting for {job_name}. Current status is {job_status}.")
                message = {"status": "Summarization in progress"}
                response = apigw_client.post_to_connection(ConnectionId=connectionId,
                                                           Data=json.dumps(message).encode('utf-8'))
            time.sleep(10)
    except Exception as err:
        logger.error(
            "Couldn't start state machine %s. Here's why: %s",
            STEP_FUNCTION_ARN,
            err
        )
    return {
        "status": 200
    }
