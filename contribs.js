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
            contrib_data = {};
            maintainer_data = {};
            $.map(commits.data, function(c) {
                var commit_date = floorDate(
                    new Date(c.commit.committer.date)).getTime();
                if ('author' in c && c.author !== null) {
                    if ($.inArray(c.author.login, logins) == -1) {
                        if (commit_date in contrib_data) {
                            contrib_data[commit_date]['count'] += 1;
                            contrib_data[commit_date]['info'].push(c.author.login);
                        } else {
                            contrib_data[commit_date] = {};
                            contrib_data[commit_date]['count'] = 1;
                            contrib_data[commit_date]['info'] = [c.author.login];
                        }
                    } else {
                        if (commit_date in maintainer_data) {
                            maintainer_data[commit_date]['count'] += 1;
                            maintainer_data[commit_date]['info'].push(c.author.login);
                        } else {
                            maintainer_data[commit_date] = {};
                            maintainer_data[commit_date]['count'] = 1;
                            maintainer_data[commit_date]['info'] = [c.author.login];
                        }
                    }
                } else {
                    if (commit_date in contrib_data) {
                        contrib_data[commit_date]['count'] += 1;
                        contrib_data[commit_date]['info'].push(c.commit.committer.email);
                    } else {
                        contrib_data[commit_date] = {};
                        contrib_data[commit_date]['count'] = 1;
                        contrib_data[commit_date]['info'] = [c.commit.committer.email];
                    }
                }
            });

            contribs = [];
            for (var i in contrib_data) {
                contribs.push([i, contrib_data[i]['count'], contrib_data[i]['info']]);
            }
            contribs.sort(function(p, q) { return p - q; });
            maintainers = [];

            for (var i in maintainer_data) {
                maintainers.push([i, maintainer_data[i]['count'], maintainer_data[i]['info']]);
            }
            maintainers.sort(function(p, q) { return p - q; });

            flot_data = [
                { 'label': 'Maintainers', 'data': maintainers },
                { 'label': 'Contributors', 'data': contribs },
            ];

            opts = {
                xaxis: {
                    mode: 'time'
                },
                series: {
                    stack: true,
                    bars: { 
                        show: true,
                        barWidth: 24 * 60 * 60 * 500,
                        align: 'center',
                        //lineWidth: 0
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
                        
                        unique = {};
                        $.map(item.series.data, function(d) {
                            $.each(d[2], function(val, user) {
                                unique[user] = 1;
                            });
                            return unique;
                        });

                        var keys = []; for (var k in unique) keys.push(k);

                        showTooltip(item.pageX, item.pageY, keys);

                    }
                }
            });
        });
    },
    getLogins = function(github_user, github_repo) {
        maintainer_url = github_base_url + '/repos/' + github_user + '/'
                         + github_repo + '/collaborators?callback=?',
        $.getJSON(maintainer_url, function(maintainers) {
            logins = $.map(maintainers.data, function(maintainer) {
                return maintainer.login;
            });
    
            getCommits(logins);
            $('#previous').bind('click', function() {
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
