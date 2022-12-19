const { Octokit } = require("@octokit/rest");
const JiraApi = require('jira-client');
const config = require('./config.json');
const gitHubClient = createGitHubClient();
const jiraCLient = createJiraClient();

async function run(){


    const issues = await fetchAllIssues();

    console.log(`Issues found :`, issues.length);

    for(let issue of [issues[0]]){
        await handleIssue(issue);
    }

}

async function handleIssue(gitHubIssue) {
    console.log(gitHubIssue)
    // Determine desired fields
    const issueSummary = gitHubIssue.title;
    const issueContent = gitHubIssue.body;
    const gitHubIssueUrl = gitHubIssue.html_url;
    const issueBody = `${issueContent}\n\n${gitHubIssueUrl}`;

    await jiraCLient.addNewIssue(createJiraIssueBody(issueSummary, issueBody))
}

async function fetchAllIssues(){
        const {data: openIssues} = await gitHubClient.issues.listForRepo({
        owner: config.github_owner,
        repo: config.github_repo,
        labels: config.github_labels_filter,
        per_page: 100,
        state: "open"
    });
    const {data: closedIssues} = await gitHubClient.issues.listForRepo({
        owner: config.github_owner,
        repo: config.github_repo,
        labels: config.github_labels_filter,
        per_page: 100,
        state: "closed"
    });
    return [...openIssues, ...closedIssues];
}

function createGitHubClient(){
    return new Octokit({
        auth: config.github_pan
    });
}

function createJiraClient(){
    // https://jira-node.github.io/
    // https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/
    return new JiraApi({
        protocol: 'https',
        host: config.jira_domain,
        username: config.jira_username,
        password: config.jira_token,
        apiVersion: '3',
        strictSSL: true
    });
}

function filterIssuesByTitle(issues, titleStartsWith){
    return issues.filter(x => x.title.startsWith(titleStartsWith));
}

function createJiraIssueBody(summary, content){
    // https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post
    return {
        "fields": {
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{
                            "type": "text",
                             "text": content
                        }]
                    }
                ]
            },
            "project": {
                "key": config.jira_project
            },
            "issuetype": {
                 id: '10172'
            },
            "assignee": {
                accountId: config.jira_userid
            }
        }
    }
}

console.log("...Start");
run()
    .then(() => console.log(`...End`))
    .catch(console.error)