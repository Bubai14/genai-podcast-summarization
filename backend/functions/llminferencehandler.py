import json
import time
import boto3
import logging
import os
import base64

success_message = {"message":"success"}
error_message = {"message":"error"}

# Initialize the logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize the S3 client
s3 = boto3.client("s3", verify=False)
BUCKET_NAME = os.getenv("UploadBucket")
key = 'transcribe/transcribe_podcast.json'

# Initialize the Step Functions
sf = boto3.client('stepfunctions')

# Initialize the queue
QUEUE_URL = os.getenv("PodcastQueueUrl")
sqs = boto3.client('sqs')


def lambda_handler(event, context):
    logger.info(event)
    task_token = str(event['token'])
    connectionId = str(event['connectionId'])
    publishUrl = str(event['publishUrl'])
    prompt = str(event['prompt'])

    response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
    data = json.loads(response['Body'].read().decode('utf-8'))
    text = data['results']['transcripts'][0]['transcript']
    #logger.info("msg:", data['results']['transcripts'][0]['transcript'][:500])

    # prompt 1: Get a summary of the podcast.
    prompt = prompt + "\n\n" + text + "\n\nAssistant:"
    #prompt = "\n\nHuman:Summarize the following text in a concise manner. Limit the response to 1000 words. Write the response in bullet points. \n\n""" + text + "\n\nAssistant:"
    body = json.dumps({
        "prompt": prompt,
        "max_tokens_to_sample": 1500,
        "temperature": 0.1,
        "top_p": 0.5
    })

    # Get summary from Bedrock
    modelId = 'anthropic.claude-v2'
    accept = 'application/json'
    contentType = 'application/json'
    bedrock = boto3.client(service_name='bedrock-runtime')
    response = bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    response_body = json.loads(response.get('body').read())
    summary = response_body.get('completion')
    # display the response
    logger.info(summary)

    # send sqs message with the current date & time
    MessageAttributes = {
        'Name': {
            'StringValue': 'LLM Processor',
            'DataType': 'String'
        }
    }
    message = {"summary": summary, "connectionId": connectionId, "publishUrl": publishUrl}
    messageResponse = sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(message),
        MessageAttributes=MessageAttributes
    )

    # Callback to Step function for completion
    sf.send_task_success(taskToken=task_token, output=json.dumps(success_message))
    return {
        'output': response_body.get('completion')
    }
