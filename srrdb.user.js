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
var titleElement = 'title_Brnd1';
var entries = [];



function clearSceneList(deleteJSONEntries) {

    var sceneItems = document.getElementsByClassName('scene-item');
    for (let i=sceneItems.length; i--;) {
        sceneItems[i].remove();
    }

    if (deleteJSONEntries) {
        entries = [];
    }
    
}




function createSceneEntry(rel_name, size, date, nfo, srs) {
    var entry = document.createElement('tr');
    entry.className = 'scene-item';
    entry.style.textAlign = 'center';

    var tdRelName = document.createElement('td');
    var tdsize = document.createElement('td');
    var tddate = document.createElement('td');
    var tdHasNfo = document.createElement('td');
    var tdHasSrs = document.createElement('td');


    if (rel_name) {
        tdRelName.style.textAlign = 'left';
        tdRelName.innerHTML = '<a class="lnk" href="https://www.srrdb.com/release/details/'+rel_name+'">'+rel_name+'</a>';
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
    console.log('drawing scene release table under tracklist...');
    var domRelTrackList = document.getElementById(relTrackList);
    if (domRelTrackList) {

        var sectionTitle = document.createElement('div');
        sectionTitle.style = 'margin-top: 15px; display: flex; width: 100%; font-weight: bold; font-size: 14px; border-bottom: 1px solid #e5e5e5;';
        sectionTitle.innerHTML = `
            <span>SrrDB Releases</span>
            <span id="sceneRelCount" style="display: none; float: right; font-weight: normal; margin-left: 5px;font-size: 14px;position: relative;bottom: 1px;">(0)</span>
        `;
        domRelTrackList.parentElement.appendChild(sectionTitle);

        var sceneReleaseList = document.createElement('div');
        sceneReleaseList.innerHTML = `
            
            <div id="loadingForRels" style="display: flex;">
                <img style="margin-right: 5px;position: relative;top: 3px;" height="16px" width="16px" alt="" src="data:image/gif;base64,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" />
                <span>Looking for releases...</span>
            </div>

            <table id="sceneRels" style="display: none;">

                <style>.lnk {color: #2653d9 !important}</style>

                <tbody id="sceneRelItems">
                <tr>
                    <th style="text-align: left;">
                    Release</th>
                    <th>Size
                        <a id="srrdb-bysize" class="lnk" href="#/">↕</a>
                    </th>
                    <th>Uploaded
                        <a id="srrdb-bydate" class="lnk" href="#/">↕</a>
                    </th>
                    <th style="width: 50px;">NFO?
                        <a id="srrdb-bynfo" class="lnk" href="#/">↕</a>
                    </th>
                    <th style="width: 50px;">SRS?
                        <a id="srrdb-bysrs" class="lnk" href="#/">↕</a>
                    </th>
                </tr>
                </tbody>
            </table>

        `;

        sceneReleaseList.style = 'overflow-y: scroll; max-height: 275px; border-bottom: 1px solid #e5e5e5;';
        domRelTrackList.parentElement.appendChild(sceneReleaseList);
        domRelTrackList.parentElement.style.marginBottom = '15px';


        var expandSceneRelList = document.createElement('a');
        expandSceneRelList.innerText = 'View All';
        expandSceneRelList.className = 'lnk';
        expandSceneRelList.id = 'expandSceneRels';
        expandSceneRelList.href = '#/';
        sceneReleaseList.parentElement.appendChild(expandSceneRelList);


        var expanded = false;
        expandSceneRelList.addEventListener('click', function(){
            if (!expanded) {
                sceneReleaseList.style.maxHeight = 'unset';
                expanded = true;
                this.innerText = 'Collapse';
            }
            else {
                sceneReleaseList.style.maxHeight = '275px';
                sectionTitle.scrollIntoView({
                    behavior: 'smooth'
                });
                expanded = false;
                this.innerText = 'View All';
            }
        })


        var sortbyDate = document.getElementById('srrdb-bydate');
        var sortbySize = document.getElementById('srrdb-bysize');
        var sortbyNFO = document.getElementById('srrdb-bynfo');
        var sortbySRS = document.getElementById('srrdb-bysrs');
        
        var sortbyDateDesc = false;
        var sortbySizeDesc = false;
        var sortbyNFODesc = false;
        var sortbySRSDesc = false;

        sortbyDate.addEventListener('click', function(){
            
            if (!sortbyDateDesc) {
                sortbyDateDesc = true
                entries.sort(function (b, a) {
                    return a['date'].localeCompare(b['date']);
                });
            }
            else {
                sortbyDateDesc = false;
                entries.sort(function (a, b) {
                    return a['date'].localeCompare(b['date']);
                });
            }

            clearSceneList(false);
            drawSceneItems();
        })

        sortbySize.addEventListener('click', function(){
            
            if (!sortbySizeDesc) {
                sortbySizeDesc = true
                entries.sort(function (a, b) {
                    return b['size'] - a['size'];
                });
            }
            else {
                sortbySizeDesc = false;
                entries.sort(function (a, b) {
                    return a['size'] - b['size'];
                });
            }

            clearSceneList(false);
            drawSceneItems();
        })

        sortbyNFO.addEventListener('click', function(){
            
            if (!sortbyNFODesc) {
                sortbyNFODesc = true
                entries.sort(function (a, b) {
                    return Number(b['hasNFO']) - Number(a['hasNFO']);
                });
            }
            else {
                sortbyNFODesc = false;
                entries.sort(function (a, b) {
                    return Number(a['hasNFO']) - Number(b['hasNFO']);
                });
            }

            clearSceneList(false);
            drawSceneItems();
        })

        sortbySRS.addEventListener('click', function(){
            
            if (!sortbySRSDesc) {
                sortbySRSDesc = true
                entries.sort(function (a, b) {
                    return Number(b['hasSRS']) - Number(a['hasSRS']);
                });
            }
            else {
                sortbySRSDesc = false;
                entries.sort(function (a, b) {
                    return Number(a['hasSRS']) - Number(b['hasSRS']);
                });
            }

            clearSceneList(false);
            drawSceneItems();
        })

    }
}



function drawSceneItems() {

    var numItems = entries.length;

    for (let i=0; i<entries.length; i++) {
        var entryItemElement = createSceneEntry(entries[i]['release'], entries[i]['size'], entries[i]['date'], entries[i]['hasNFO'], entries[i]['hasSRS']);
        var domRelItems = document.getElementById('sceneRelItems');
        if (domRelItems) {
            domRelItems.appendChild(entryItemElement);
        }
    }

    document.getElementById('loadingForRels').firstElementChild.style.display = 'none';

    if (numItems > 0) {
        console.log('drawing '+numItems+' scene release items...');
        
        document.getElementById('loadingForRels').style.display = 'none';
        document.getElementById('sceneRels').style.display = 'table';
        document.getElementById('sceneRelCount').style.display = 'block';
        document.getElementById('sceneRelCount').innerText = '(' + numItems.toString() + ')';
    }
    else {
        document.getElementById('loadingForRels').lastElementChild.innerText = "No releases were found.";
    }

}



function adjustJson(json) {

    clearSceneList(true);

    for (entry in json['results']) {
        if (!json['results'][entry]['release']) {
            json['results'][entry]['release'] = 'Untitled';
        }

        if (!json['results'][entry]['size']) {
            size = 0;
        }
        if (!json['results'][entry]['date']) {
            json['results'][entry]['date'] = ''
        }

        if (json['results'][entry]['hasNFO'] != null) {
            if (json['results'][entry]['hasNFO'] == 'yes') {
                json['results'][entry]['hasNFO'] = true;
            }
            else {
                json['results'][entry]['hasNFO'] = false;
            }
        }
        else {
            json['results'][entry]['hasNFO'] = false;
        }

        if (json['results'][entry]['hasSRS'] != null) {
            if (json['results'][entry]['hasSRS'] == 'yes') {
                json['results'][entry]['hasSRS'] = true;
            }
            else {
                json['results'][entry]['hasSRS'] = false;
            }
        }
        else {
            json['results'][entry]['hasSRS'] = false;
        }

        entries[entries.length] = json['results'][entry];
    }

    
    drawSceneItems();
}




async function requestSceneReleases(query) {

    if (query) {
        var formattedQuery = query.replace(/ /g, '/');
        var requestURL = 'https://api.srrdb.com/v1/search/'+formattedQuery;

        console.log(requestURL);
        document.getElementById('loadingForRels').style.display = 'flex';
        document.getElementById('loadingForRels').lastElementChild.innerText = 'Looking for releases...';

        fetch(requestURL)
        .then(res => res.json())
        .then(out => adjustJson(out));

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
    
    setTimeout(() => {
        createSrrDBSection();

        var query = getQuery();
        if (query) {
            requestSceneReleases(query);
        }
    }, 2000);
    
})();