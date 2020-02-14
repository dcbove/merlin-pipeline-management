# Merlin Pipeline Management
## Developer Support

Set up basic stuff for your environment.  Some of this stuff you might have to figure out on your own.
```
pip install kerb-sts
brew install node
pip3 install virtualenv
```

Check out of source control.

Build and activate a virtual environment.
```
cd merlin
virtualenv venv -p python3
source venv/bin/activate
```

Install all the python libraries.
```
pip3 install boto3 pip-tools 
cd merlin-gateway
pip-compile --output-file requirements.txt requirements/requirements.in
pip install -r requirements.txt
```


Install node libraries for dev support (I provide a grunt script in order to support development). Not really intended
for production deployments.
```
cd merlin-pipeline-management
npm install -g grunt-cli
npm install grunt --save-dev
npm install grunt-zip grunt-aws-s3 grunt-exec grunt-concurrent grunt-set-env grunt-env --save-dev
```
then, to deploy:
```
grunt update-stack  # deploys or update aws-artifacts/cfn/master.yml
```

## CLI
See the variables for your pipeline:
```
aws codepipeline list-action-executions \
  --pipeline-name merlin-python-layer \
  --filter pipelineExecutionId=532d1b11-e516-4774-922a-f10074beb93b
```
