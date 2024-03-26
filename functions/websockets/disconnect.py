import logging

# Initialize the logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    logger.info(event)
    logger.info("WebSocket Disconnected")
    logger.info(context)
    return {"statusCode": 200}
