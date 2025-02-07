// ==UserScript==
// @name         SrrDB Checker For Discogs
// @namespace    http://tampermonkey.net/
// @version      2025-02-02
// @description  Fetches available SrrDB releases for discogs music.
// @author       splatert
// @match        https://www.discogs.com/release/*
// @match        https://www.discogs.com/master/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=discogs.com
// @grant        none
// ==/UserScript==


var relTrackList = 'release-tracklist';
var titleElement = 'title_1q3xW';



function createSceneEntry(rel_name, size, date, nfo, srs) {
    var entry = document.createElement('tr');
    entry.style.textAlign = 'center';

    var tdRelName = document.createElement('td');
    var tdsize = document.createElement('td');
    var tddate = document.createElement('td');
    var tdHasNfo = document.createElement('td');
    var tdHasSrs = document.createElement('td');


    if (rel_name) {
        tdRelName.style.textAlign = 'left';
        tdRelName.innerHTML = '<a href="https://www.srrdb.com/release/details/'+rel_name+'">'+rel_name+'</a>';
    }
    if (size) {
        var mb = (size / (1024*1024)).toFixed(2);
        tdsize.innerText = mb.toString() + ' MB';
    }
    if (date) {
        tddate.innerText = date;
    }
    if (nfo != null) {
        if (nfo == true) {
            tdHasNfo.style = 'background: rgb(98, 194, 45);';
            tdHasNfo.innerText = 'Y';
        }
        else {
            tdHasNfo.style = 'background: rgb(194, 45, 45); color: white;';
            tdHasNfo.innerText = 'N';
        } 
    }
    if (srs != null) {
        if (srs == true) {
            tdHasSrs.style = 'background: rgb(98, 194, 45);';
            tdHasSrs.innerText = 'Y';
        }
        else {
            tdHasSrs.style = 'background: rgb(194, 45, 45); color: white;';
            tdHasSrs.innerText = 'N';
        }
    }

    entry.appendChild(tdRelName);
    entry.appendChild(tdsize);
    entry.appendChild(tddate);
    entry.appendChild(tdHasNfo);
    entry.appendChild(tdHasSrs);

    return entry;
}



function createSrrDBSection() {
    var domRelTrackList = document.getElementById(relTrackList);
    if (domRelTrackList) {

        var sectionTitle = document.createElement('div');
        sectionTitle.style = 'margin-top: 15px; display: flex; width: 100%; font-weight: bold; font-size: 14px; border-bottom: 1px solid #e5e5e5;';
        sectionTitle.innerHTML = `
        <span>SrrDB Releases</span>
        <span id="sceneRelCount" style="float: right; font-weight: normal; margin-left: 15px; ">(0 results)</span>
        `;
        domRelTrackList.parentElement.appendChild(sectionTitle);

        var sceneReleaseList = document.createElement('div');
        sceneReleaseList.innerHTML = `
            <span id="loadingForRels">Looking for releases...</span>

            <table id="sceneRels" style="display: none;">
                <tbody id="sceneRelItems">
                <tr>
                    <th style="text-align: left;">Release</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th style="width: 50px;">NFO?</th>
                    <th style="width: 50px;">SRS?</th>
                </tr>
                </tbody>
            </table>

        `;

        sceneReleaseList.style = 'margin-bottom: 15px;';
        domRelTrackList.parentElement.appendChild(sceneReleaseList);
    }
}




function displaySceneResponse(json) {
    
    var title, date = '';
    var size = 0;
    var nfo, srs = false;

    var numItems = 0


    for (entry in json['results']) {
        if (json['results'][entry]['release']) {
            title = json['results'][entry]['release'];
        }
        else {
            title = 'Untitled';
        }

        if (json['results'][entry]['size']) {
            size = json['results'][entry]['size'];
        }
        else {
            size = 0;
        }

        if (json['results'][entry]['date']) {
            date = json['results'][entry]['date'];
        }
        else {
            date = ''
        }

        if (json['results'][entry]['hasNFO'] != null) {
            if (json['results'][entry]['hasNFO'] == 'yes') {
                nfo = true;
            }
            else {
                nfo = false;
            }
        }
        if (json['results'][entry]['hasSRS'] != null) {
            if (json['results'][entry]['hasSRS'] == 'yes') {
                srs = true;
            }
            else {
                srs = false;
            }
        }
        var entryItemElement = createSceneEntry(title, size, date, nfo, srs);
        document.getElementById('sceneRelItems').appendChild(entryItemElement);

        numItems += 1;
    }

    if (numItems > 0) {
        document.getElementById('loadingForRels').style.display = 'none';
        document.getElementById('sceneRels').style.display = 'table';
        document.getElementById('sceneRelCount').innerText = '(' + numItems.toString() + ' results)';
    }
    else {
        document.getElementById('loadingForRels').innerText = "No releases were found.";
    }

}




async function requestSceneReleases(query) {

    if (query) {
        var formattedQuery = query.replace(/ /g, '/');
        var requestURL = 'https://api.srrdb.com/v1/search/'+formattedQuery;

        console.log(requestURL);
        document.getElementById('loadingForRels').style.display = 'block';
        document.getElementById('loadingForRels').innerText = 'Looking for releases...';

        fetch(requestURL)
        .then(res => res.json())
        .then(out => displaySceneResponse(out));

    }
}


function getQuery() {
    
    var query = '';

    var titleDom = document.getElementsByClassName(titleElement)[0];
    if (titleDom) {
        query = titleDom.innerText;
        query = query.toLowerCase();
        query = query.replace(/[^a-zA-Z0-9 ]/g, '')

        
        
        var artistWordsToDel = [' featuring', ' feat'];

        // remove featuring, feat, or any keyword that might limit amount of results.
        for (let i=0; i<artistWordsToDel.length; i++) {
            if (query.includes(artistWordsToDel[i])) {
                query = query.replace(artistWordsToDel[i], '');
            }
        }

        // having "various" (ie "various artists") as an artist name can limit amount of srrdb results. Remove it.
        if (query.startsWith('various')) {
            query = query.substring('various'.length);
        }
        


    }

    console.log(query);
    return query;
}




(function() {
    createSrrDBSection();

    var query = getQuery();
    if (query) {
        requestSceneReleases(query);
    }
    
})();