$(function() {
    var github_base_url = 'https://api.github.com',
    github_user = 'mozilla',
    github_repo = 'graphs',
    next,
    logins,
    floorDate = function(d) {
        // floor a JS date object to just a date (drops the time)
        d.setMilliseconds(0);
        d.setSeconds(0);
        d.setMinutes(0);
        d.setHours(0);
        return d;
    },
    getCommits = function(logins, commits_url) {
        if (!commits_url) {
            commits_url = github_base_url + '/repos/' + github_user + '/'
                              + github_repo + '/commits?callback=?';
        }
        $.getJSON(commits_url, function(commits) {
            next = commits.meta.Link[0][0] + '&callback=?';
            console.log(commits.meta.Link);
            contrib_data = {};
            collab_data = {};
            $.map(commits.data, function(c) {
                var commit_date = floorDate(
                    new Date(c.commit.committer.date)).getTime();
                if ('author' in c && c.author !== null) {
                    if ($.inArray(c.author.login, logins) == -1) {
                        if (commit_date in contrib_data) {
                            contrib_data[commit_date] += 1;
                        } else {
                            contrib_data[commit_date] = 1;
                        }
                    } else {
                        if (commit_date in collab_data) {
                            collab_data[commit_date] += 1;
                        } else {
                            collab_data[commit_date] = 1;
                        }
                    }
                } else {
                    if (commit_date in contrib_data) {
                        contrib_data[commit_date] += 1;
                    } else {
                        contrib_data[commit_date] = 1;
                    }
                }
            });

            contribs = [];
            for (var i in contrib_data) {
                contribs.push([i, contrib_data[i]]);
            }
            contribs.sort(function(p, q) { return p - q; });
            collabs = [];

            for (var i in collab_data) {
                collabs.push([i, collab_data[i]]);
            }
            collabs.sort(function(p, q) { return p - q; });

            flot_data = [
                { 'label': 'Contributors', 'data': contribs },
                { 'label': 'Collaborators', 'data': collabs },
            ];

            opts = {
                xaxis: {
                    mode: 'time'
                },
                series: {
                    stack: true,
                    bars: { show: 'True',
                            barWidth: 24 * 60 * 60 * 1000,
                            lineWidth: 0
                    },
                },
                grid: {
                    hoverable: true
                }
            }

            $.plot($('#placeholder'), flot_data, opts);

            var previousPoint = null;
            $("#placeholder").bind("plothover", function (event, pos, item) {
                if (item) {
                    if (previousPoint != item.dataIndex) {
                        previousPoint = item.dataIndex;
                        
                        $("#tooltip").remove();
                        var x = item.datapoint[0].toFixed(2),
                            y = item.datapoint[1].toFixed(2);
                        
                        showTooltip(item.pageX, item.pageY,
                                    item.series.label + " of " + x + " = " + y);
                    }
                }
                console.log('hover');
            });
        });
    },
    getLogins = function(github_user, github_repo) {
        collab_url = github_base_url + '/repos/' + github_user + '/'
                         + github_repo + '/collaborators?callback=?',
        $.getJSON(collab_url, function(collabs) {
            logins = $.map(collabs.data, function(collab) {
                return collab.login;
            });
    
            getCommits(logins);
            $('#previous').bind('click', function() {
                console.log(next);
                getCommits(logins, next);
            });
        });
    },
    showTooltip = function(x, y, contents) {
        $('<div id="tooltip">' + contents + '</div>').css( {
            position: 'absolute',
            display: 'none',
            top: y + 5,
            left: x + 5,
            border: '1px solid #fdd',
            padding: '2px',
            'background-color': '#fee',
            opacity: 0.80
        }).appendTo("body").fadeIn(200);
    }

    $('#user').val(github_user);
    $('#repo').val(github_repo);

    $('#change').bind('click', function() {
        github_user = $('#user').val();
        github_repo = $('#repo').val();
        getLogins(github_user, github_repo);
    });

    getLogins(github_user, github_repo);
});
