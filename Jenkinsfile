pipeline {
    agent {
        label 'docker'
    }
    options {
        skipDefaultCheckout(true) // This is required if you want to clean before build
        ansiColor('gnome-terminal')
    }

    parameters {
        string(name: 'AUTHURL', defaultValue: 'dory-review.financial.com', description: 'Auth-URL to be used for test execution')
        string(name: 'RESTURL', defaultValue: 'dory-review.financial.com', description: 'Rest-URL to be used for test execution')
        string(name: 'HELPERURL', defaultValue: 'dory-review.dev-green.svc.k8s.muc1tes.financial.com', description: 'Helper-URL to be used for test execution')
        booleanParam(name: 'NOPROXY', defaultValue: true, description: 'if true, disable proxy. This needs to be set when accessing internal URLs')
        booleanParam(name: 'NOTIFY', defaultValue: false, description: 'if true, notification will be sent to green team channel')
        string(name: 'USERNAME', defaultValue: 'dory_qa', description: 'User Name')
        password(name: 'PASSWORD', defaultValue: '', description: 'Password')
        string(name: 'PRODUCT', defaultValue: 'DORY_QA', description: 'Product Name')
        string(name: 'ITERATIONS', defaultValue: '5', description: 'if true, all the failed tests in first run will be executed once again')
        string(name: 'VIRTUAL_USERS', defaultValue: '5', description: 'if true, the input parameters will pick up random values from the list of values, otherwise take constant default values')
        string(name: 'MAX_REDIRECTS', defaultValue: '4', description: 'Number of times a request has to be executed, different from retry of failed tests')
        string(name: 'DURATION', defaultValue: '30s', description: 'If value is DoryRest-Whole Suite will be run, else specify endpoint(s) [comma separated] form the list -Alerts,Company,Derivatives,DoryUser,EconomicData,ESG Data,Events,Find,Funds,Indices,Logging,Masterdata,MarketDepth,News,Product-1822Direkt,Product-Brokerstats,Product-DNB,Product-MyMarkets,Product-TD,Product-TRDL,Product-UBS,Quote,Ratings,Stock-Screener,Translations,TimeSeries,RET')

    }

    stages {
        stage('Clean & SCM Checkout') {
            steps {
                // Clean before build
                cleanWs()
                // We need to explicitly checkout from SCM here
                checkout scm
            }
        }
        stage('Preparation') {
            steps {
                // Clean before build
                cleanWs()
                // We need to explicitly checkout from SCM here
                checkout scm
                script {
                    sh '''
                        set +x
                        sed -i "s/<authUrl>/$AUTHURL/" k6-script.js
                        sed -i "s/<baseUrl>/$RESTURL/" k6-script.js
                        sed -i "s/<helperUrl>/$HELPERURL/" k6-script.js
                        sed -i "s/<username>/$USERNAME/" k6-script.js
                        sed -i "s/<password>/$PASSWORD/" k6-script.js
                        sed -i "s/<product>/$PRODUCT/" k6-script.js
                        sed -i "s/<iterations>/$ITERATIONS/" k6-script.js
                        sed -i "s/<virtualusers>/$VIRTUAL_USERS/" k6-script.js
                        sed -i "s/<maxredirects>/$MAX_REDIRECTS/" k6-script.js
                        sed -i "s/<duration>/$DURATION/" k6-script.js
                   '''

                }
            }
        }
        stage('Docker Build & Run') {
            steps {
                script {
                    sh '''
                    docker build \\
                        --build-arg HTTP_PROXY=$HTTP_PROXY \\
                        --build-arg HTTPS_PROXY=$HTTPS_PROXY \\
                        --build-arg NO_PROXY=$NO_PROXY \\
                        -t docker-hosted.financial.com/dory-automation .
                    '''
                    if (params.NOPROXY == true) {
                        sh '''
                        docker run \\
                             -v "$WORKSPACE:/app" \\
                            -e NO_PROXY=$NO_PROXY \\
                            docker-hosted.financial.com/dory-automation
                        '''
                    } else {
                        sh '''
                        docker run \\
                             -v "$WORKSPACE:/app" \\
                            -e HTTP_PROXY=$HTTP_PROXY \\
                            -e HTTPS_PROXY=$HTTPS_PROXY \\
                            docker-hosted.financial.com/dory-automation
                        '''
                    }
                }
            }
        }
    }
    post {
        always {
            //archiveArtifacts artifacts: 'newman/*.html', onlyIfSuccessful: false
            publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: false, reportFiles: '*.html', reportName: 'TestReport', reportTitles: '', useWrapperFileDirectly: true])
            zip archive: true, exclude: '', glob: '', zipFile: 'results.zip'
            junit keepLongStdio: true, testResults: 'junit.xml'
            cleanWs()
        }
    }
}