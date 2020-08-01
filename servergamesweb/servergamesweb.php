<html>
<?php

static $username;
static $password;
static $isLoggedIn;

if (!session_id()) {
    $isLoggedIn = false;
    session_start();
    $_SESSION['isLoggedIn'] = $isLoggedIn;
}

?>

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

            --header-height: 7.5rem;
            --header-tabs-height: 2rem;
            --header-tabs-spacing: 2rem;
            --header-tabs-margin: .5rem;
            --header-border-color: black;
            --header-border-width: 1.5px;
            --header-bgcolor: #1a20ff;
            --user-menu-button-width: 5rem;
            --drawer-width: 16rem;
            --drawer-bgcolor: #111;

            --content-smaller-margin: 1rem;
            --content-larger-margin: 2.5rem;

            --card-width: 20rem;
            --card-height: 7.5rem;
            --card-shadow: .7rem;
            --card-spacing: 2rem;
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

        .flex-drawer:hover,
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

            flex-direction: column;

            flex: 0 0 var(--header-height);
        }
        
        .header-title {
            display: flex;
            flex-direction: row;
            width: auto;
            flex: 1 0 auto;
            flex-direction: row;
        }

        .header-title > *:first-child {
            display: flex;
            flex: 0 0 var(--user-menu-button-width);
        }

        .header-label {
            display: flex;
            flex-direction: column;
            justify-content: center;
            flex: 1 0 auto;
        }

        .header-label > * {
            display: block;
            text-align: center;
        }

        .user-menu-button {
            display: flex;
            flex-direction: column;
            justify-content: center;
            background-color: grey;
            flex: 0 0 var(--user-menu-button-width);
            cursor: pointer;
            /* transition: 1s; */
        }

        .user-menu-button > span {
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 100%;
            height: 100%;
        }

        .user-menu-button > span > .flex-drawer {
            transition: 3s;
        }

        .user-menu-button[menu-open] > span > .flex-drawer {
            width: var(--drawer-width);
        }

        .user-menu-button-content {
            display: block;
            text-align: center;
            font-size: 2rem;
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

<body onload="app.pageReady(window, 'appTemplate');">
    <template id="appTemplate">
        <auto-selector item="app.drawerOpen" attribute-element="appLeftDrawerDiv" use-attribute="open"></auto-selector>
        <div id="appLeftDrawerDiv" class="flex-drawer" left-drawer>
            <div>Drawer Contents</div>
        </div>
        <!-- <div id="appRightDrawerDiv" class="flex-drawer" right-drawer>
            <div>General Chat</div>
        </div> -->
        <div class="header-container">
            <div class="header-title">
                <div class="header-spacer"></div>
                <div class="header-label"><div>Stuff</div></div>
                <menu-selector class="user-menu-button" css-transition>
                    <template menu-button><div class="user-menu-button-content">...</div></template>
                    <template menu-flyout>
                        <div class="flex-drawer" right-drawer>
                            <div class="user-menu-title">User Menu</div>
                            <div class="user-menu-content"></div>
                        </div>
                    </template>
                </menu-selector>
            </div>
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
                <inline-repeat items="app.homeCards" initial="[]" alias="eachCard">
                    <template empty-template>
                        <div class="card-container">
                            <div class="card-content">Nothing to show!</div>
                        </div>
                        <div class="card-spacer"></div>
                    </template>
                    <template item-template>
                        <div class="card-container">
                            <div class="card-content">
                                <item-div item="{{eachCard}}" display-property="text"></item-div>
                            </div>
                        </div>
                        <div class="card-spacer"></div>
                    </template>
                </inline-repeat>
                <inline-ajax parent-trigger trigger-attribute="selected" href="./get.php?t=homecards" items="app.homeCards"></inline-ajax>
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
                <inline-ajax parent-trigger trigger-attribute="selected" href="./get.php?t=games" items="app.activeGames"></inline-ajax>
            </click-div>
            <click-div class="tab-container" click-group click-mirror="Forum">
            </click-div>
            <click-div class="tab-container" click-group click-mirror="About">
            </click-div>
        </div>
        <!-- <window-screen-syncer scale-device mobile-width="640"></window-screen-syncer> -->
    </template>
    <template id="phpErrorTemplate">
        <div>PHP Had a boo boo!</div>
    </template>
</body>

<script type="module" src="./servergamesweb.js"></script>

</html>