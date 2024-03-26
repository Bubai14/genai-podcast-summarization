import logging
import boto3
import json

# Initialize the logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    logger.info(event)

    print("test")
    payload = event['Records'][0]["body"]
    fullpayload = str(payload)
    logger.info(fullpayload)
    body = json.loads(fullpayload)

    connectionId = body['connectionId']
    publishUrl = body['publishUrl']
    summary = body['summary']
    message = {"summary": summary}

    # publish the information
    logger.info("publishing the summary")
    apigw_client = boto3.client('apigatewaymanagementapi', endpoint_url=publishUrl)
    apigw_client.post_to_connection(ConnectionId=connectionId,
                                    Data=json.dumps(message).encode('utf-8'))
