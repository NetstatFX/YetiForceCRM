{*<!--
/*********************************************************************************
** The contents of this file are subject to the vtiger CRM Public License Version 1.0
* ("License"); You may not use this file except in compliance with the License
* The Original Code is:  vtiger CRM Open Source
* The Initial Developer of the Original Code is vtiger.
* Portions created by vtiger are Copyright (C) vtiger.
* All Rights Reserved.
*
********************************************************************************/
-->*}
{strip}
    <input type="hidden" name="timeFormatOptions" data-value="{\App\Purifier::encodeHtml($DAY_STARTS)}"/>
    {assign var=WIDTHTYPE value=$USER_MODEL->get('rowheight')}
    {include file=\App\Layout::getTemplatePath('Detail/BlockView.tpl', $MODULE_NAME) RECORD_STRUCTURE=$RECORD_STRUCTURE MODULE_NAME=$MODULE_NAME}
{/strip}
