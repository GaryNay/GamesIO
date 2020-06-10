<html>

<head>
    <style>
        body {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            padding: 0;
            margin: 0;
            --highlight: #dadada;
            --highlight-alt: #e1e1e1;
            --highlight-lighter: #efefef;
            --white: white;
            --sideHighlighter: #794300;
            --warning: #991111;

            --font-color: #111;
            --font-color-alt: #ddd;

            --header-height: 120px;
            --header-tabs-height: 32px;
            --header-tabs-spacing: 32px;
            --header-tabs-margin: 8px;
            --header-border-color: black;
            --header-border-width: 1.5px;
            --header-bgcolor: #1a20ff;
            --drawer-width: 260px;
            --drawer-bgcolor: #111;

            --content-smaller-margin: 16px;
            --content-larger-margin: 48px;

            --card-width: 320px;
            --card-height: 120px;
            --card-shadow: 10px;
            --card-spacing: 32px;
        }

        .flex-drawer {
            display: block;
            height: 100%;
            width: 5px;
            position: fixed;
            z-index: 1;
            top: 0;
            color: var(--font-color-alt);
            background-color: var(--drawer-bgcolor);
            overflow-x: hidden;
            transition: 0.5s;
            padding-top: 60px;
        }

        .flex-drawer:not([right-drawer]) {
            left: 0;
        }

        .flex-drawer[right-drawer] {
            right: 0;
        }

        .flex-drawer:hover {
            width: var(--drawer-width);
        }

        .flex-drawer[open] {
            width: var(--drawer-width);
        }

        /* @media screen and (min-width: 360px) {
                .flex-drawer {
                    width: var(--drawer-width);
                }
            } */
        .header-container {
            display: flex;
            padding: 0;
            margin: 0;
            background-color: var(--header-bgcolor);

            flex-direction: column-reverse;

            flex: 0 0 var(--header-height);
        }

        .header-tabs {
            display: flex;
            flex-direction: row;
            flex: 0 0 auto;
            background-color: var(--highlight);
        }

        .header-tab-item {
            display: flex;
            flex-direction: column;
            border-width: var(--header-border-width);
            border-style: solid;
            border-color: var(--header-border-color);
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
            background-color: var(--highlight-lighter);
            line-height: var(--header-tabs-height);
            transition: .2s;
            box-shadow: calc(var(--card-shadow) / 4) 0 calc(var(--card-shadow) / 4) rgba(0, 0, 0, .5);
        }

        .header-tab-item > * {
            margin: var(--header-tabs-margin);
        }

        .header-tab-item:hover {
            cursor: pointer;
        }

        .header-tab-item[selected] {
            border-bottom-color: var(--highlight-lighter);
        }

        .header-tab-item:hover,
        .header-tab-item[selected] {
            font-size: var(--header-tabs-height);
            box-shadow: var(--card-shadow) 0 calc(var(--card-shadow) / 2) rgba(0, 0, 0, .5);
        }

        .header-tab-spacer {
            display: flex;
            flex: 0 0 var(--header-tabs-spacing);
            border-bottom: solid;
            border-width: var(--header-border-width);
            border-color: var(--header-border-color);
        }

        .header-tab-spacer:last-child,
        .header-tab-spacer:first-child {
            display: flex;
            flex: 1 0 auto;
        }

        .content-container {
            display: flex;
            
            flex: 1 0 auto;
            background-color: var(--highlight-lighter);
            flex-direction: column;
            align-items: center;
        }

        .tab-container {
            opacity: 1;
            transition: .5s;
        }

        .tab-container:not([selected]) {
            opacity: 0;
            display: block;
            position: absolute;
            top: inherit;
            left: inherit;
        }

        .card-spacer {
            display: flex;
            flex: 0 0 var(--card-spacing);
        }

        .card-spacer:last-child,
        .card-spacer:first-child {
            display: flex;
            flex: 1 0 auto;
        }

        .card-container {
            display: flex;
            width: var(--card-width);
            flex: 0 0 auto;
            min-height: var(--card-height);
            background-color: white;
            box-shadow: var(--card-shadow) var(--card-shadow) calc(var(--card-shadow) / 2) rgba(0,0,0,.5);
            margin: var(--content-smaller-margin) var(--content-larger-margin);
        }

        .card-content {
            width: auto;
            margin: var(--content-smaller-margin);
            text-align: center;
        }

        *[disabled] {
            display: none;
        }
    </style>
</head>

<?php
?>

<body onload="app.pageReady(window, 'appTemplate');">
    <template id="appTemplate">
        <!-- Left Drawer Area -->
        <auto-selector item="app.drawerOpen" attribute-element="appLeftDrawerDiv" use-attribute="open"></auto-selector>
        <div id="appLeftDrawerDiv" class="flex-drawer" left-drawer>
            <div>Drawer Contents</div>
        </div>
        <div id="appRightDrawerDiv" class="flex-drawer" right-drawer>
            <div>General Chat</div>
        </div>
        <!-- Header Area -->
        <div class="header-container">
            <item-div class="header-title" item="app.headerTitle"></item-div>
            <div class="header-tabs">
                <inline-repeat in-line initial="Home,Games,Forum,About" text>
                    <template item-template>
                        <div class="header-tab-spacer"></div>
                        <click-div class="header-tab-item" click-value="{{text}}" click-group click-attribute="selected"></click-div>
                    </template>
                    <template footer-template>
                        <div class="header-tab-spacer">
                    </template>
                </inline-repeat>
            </div>
        </div>
        <div class="content-container">
            <click-div class="tab-container" click-group click-mirror="Home">
                <inline-repeat items="app.homeCards" initial="[]" alias="eachGame">
                    <template empty-template>
                        <div class="card-container">
                            <div class="card-content">Nothing to show!</div>
                        </div>
                        <div class="card-spacer"></div>
                    </template>
                    <template item-template>
                        <div class="card-container">
                            <div class="card-content">
                                <item-div item="{{eachGame}}" display-property="text"></item-div>
                            </div>
                        </div>
                        <div class="card-spacer"></div>
                    </template>
                </inline-repeat>
                <inline-ajax get-when-visible href="./get.php?t=homecards" items="app.homeCards"></inline-ajax>
            </click-div>
            <click-div class="tab-container" click-group click-mirror="Games">
                <inline-repeat items="app.activeGames" initial="[]" alias="eachGame">
                    <template empty-template>
                        <div class="card-container">
                            <div id="nothingRunningDiv" class="card-content">Nothing is currently running</div>
                            <div id="notLoggedInGamesDiv" class="card-content">Log in to see if any games are running</div>
                            <auto-selector items="app.isLoggedIn" active-element="nothingRunningDiv" inactive-element="notLoggedInGamesDiv"></auto-selector>
                        </div>
                        <div class="card-spacer"></div>
                    </template>
                    <template item-template>
                        <div class="card-container">
                            <div class="card-content">
                                <item-div item="{{eachGame}}" display-property="name" href-property="joinUrl"></item-div>
                            </div>
                        </div>
                        <div class="card-spacer"></div>
                    </template>
                </inline-repeat>
                <inline-ajax get-when-visible href="./get.php?t=games" items="app.activeGames"></inline-ajax>
            </click-div>
            <click-div class="tab-container" click-group click-mirror="Forum">
            </click-div>
            <click-div class="tab-container" click-group click-mirror="About">
            </click-div>
        </div>
    </template>
    <template id="phpErrorTemplate">
        <div>PHP Had a boo boo!</div>
    </template>
</body>

<script type="module" src="./servergamesweb.js"></script>

</html>