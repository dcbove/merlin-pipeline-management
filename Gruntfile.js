module.exports = function (grunt) {
    global["region"] = grunt.option('region') || 'us-east-1';
    global["app"] = grunt.option('app') || "merlin-pipeline-management";
    global["branch"] = grunt.option('branch') || "master";
    global["artifact_bucket"] = "appleforge-merlin-artifacts";
    global["artifact_lambda_key"] = global.app + '/' + global.branch + '/lambda/lambda.zip';
    global["output_template_file_name"] = "tmpbuild/project-" + global.app + "-" + global.branch + ".template";

    // Project configuration.
    grunt.initConfig({
        awskeys: grunt.file.readJSON('gruntkeys.json'),
        env: {
            appleforge: {
                "AWS_ACCESS_KEY_ID": "<%=awskeys.aws_access_key_id%>",
                "AWS_SECRET_ACCESS_KEY": "<%=awskeys.aws_secret_access_key%>"
            }
        },
        pkg: grunt.file.readJSON('package.json'),
        zip: {
            'build-lambda-zip': {
                cwd: 'src/',
                src: 'src/**',
                dest: 'tmpbuild/lambda.zip'
            }
        },
        aws_s3: {
            cfn: {
                options: {
                    bucket: '<%= global.artifact_bucket %>',
                    region: '<%= global.region %>',
                    awsProfile: 'default',
                    signatureVersion: 'v4'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'aws-artifacts/cfn/',
                        src: '*.yml',
                        dest: '<%= global.app %>/<%= global.branch %>/cfn/'
                    },
                    {
                        expand: true,
                        cwd: 'aws-artifacts/cfn-params/',
                        src: '*.json',
                        dest: '<%= global.app %>/<%= global.branch %>/cfn-params/'
                    },
                    {
                        expand: true,
                        cwd: 'aws-artifacts/apigw/',
                        src: '*.yml',
                        dest: '<%= global.app %>/<%= global.branch %>/apigw/'
                    }
                ]
            }
        },
        exec: {
            cfn_package: {
                cmd: function () {
                    var aws_command = 'aws cloudformation package ' +
                        ' --region ' + global.region + ' ' +
                        ' --template-file  aws-artifacts/cfn/base.yml' +
                        ' --s3-bucket ' + global.artifact_bucket + ' ' +
                        ' --s3-prefix ' + global.app + '/' + global.branch + '/templates ' +
                        ' --output-template-file ' + global.output_template_file_name;

                    grunt.log.ok(aws_command);
                    return aws_command
                }
            },
            cfn_deploy: {
                cmd: function () {
                    var aws_command = 'aws cloudformation deploy ' +
                        ' --region ' + global.region + ' ' +
                        ' --template-file ' + global.output_template_file_name +
                        ' --stack-name ' + global.branch + "-" + global.app +
                        ' --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND' +
                        " --parameter-overrides $(jq -r '.[] | [.ParameterKey, .ParameterValue] | join(\"=\")' aws-artifacts/cfn-params/" + global.branch + ".json)";

                    grunt.log.ok(aws_command);
                    return aws_command
                }
            },
            show_config: {
                cmd: function () {
                    value = process.env.AWS_ACCESS_KEY_ID;
                    return ("echo " + value);
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-zip');
    grunt.loadNpmTasks('grunt-aws-s3');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-set-env');
    grunt.loadNpmTasks('grunt-env');

    // Default task(s).
    grunt.registerTask('setenvs', 'Set environment variables', function () {
        grunt.config('awskeys', process.env)

    });
    grunt.registerTask('update-stack', ['env:appleforge', 'setenvs',  'zip', 'aws_s3:cfn', 'exec:cfn_package', 'exec:cfn_deploy']);
    grunt.registerTask('show', ['env:appleforge', 'setenvs', 'exec:show_config']);
};
