/**
 * DataViewer class
 *
 * @author Aaron Ponti
 *
 */

/**
 * A viewer to display DataModel entities to the html page.
 */
function DataViewer() {

    "use strict";

    // Hide experiment panels
    this.hideExperimentPanels();

    // Tag ids
    this.uniqueMicroscopyMetaProjectIds = [];
    this.uniqueFlowAnalysersMetaProjectIds = [];
    this.uniqueFlowSortersMetaProjectIds = [];
}

/**
 * Display status text color-coded by level.
 * @param status: text to be displayed
 * @param level: one of "success", "info", "warning", "error". Default is
 * "info"
 */
DataViewer.prototype.displayStatus = function(status, level) {

    // Get the the status div
    var status_div = $("#status");

    // Make sure the status div is visible
    status_div.show();

    // Clear the status
    status_div.empty();

    // Map the level to the bootstrap class
    var cls = "info";
    switch (level) {
        case "success":
            cls = "success";
            break;
        case "info":
            cls = "info";
            break;
        case "warning":
            cls = "warning";
            break;
        case "error":
            cls = "danger";
            break;
        default:
            cls = "info";
            break;
    }

    // Show
    status = "<div class=\"alert alert-" + cls + " alert-dismissable\">" + status + "</div>";
    status_div.html(status);

};

/**
 * Display the data.
 * @param data Array of projects (with spaces as keys).
 */
DataViewer.prototype.displayProjects = function(data) {

    // Get the projects div
    var projects_div = $("#projects");

    // Display the status
    projects_div.empty();

    // Create the panel group
    var panel_group = $("<div>")
        .addClass("panel-group")
        .attr("id", "space_group");
    projects_div.append(panel_group);

    // Get and retrieve the reference
    var panelGroupId = $("#space_group");

    // Get the spaces
    var spaces = Object.keys(data);

    for (var i = 0; i < spaces.length; i++) {

        // Create a panel for the space
        var space_panel = $("<div>")
            .attr("id", "space" + i)
            .addClass("panel")
            .addClass("panel-info");

        // Add it to the group
        panelGroupId.append(space_panel);

        // Retrieve and store the reference
        var spacePanelId = $("#space" + i);

        // Add the heading
        var space_panel_heading = $("<div>")
            .attr("id", "space_heading" + i)
            .addClass("panel-heading");
        spacePanelId.append(space_panel_heading);

        // Retrieve and store the reference
        var spaceHeadingId = $("#space_heading" + i);

        // Add the title
        var space_panel_title = $("<h4>")
            .attr("id", "space_heading_title_" + i)
            .addClass("panel-title");
        spaceHeadingId.append(space_panel_title);

        // Get and store reference
        var spacePanelTitleId = $("#space_heading_title_" + i);

        var space_panel_title_ref = $("<a>")
            .attr("data-toggle", "collapse")
            .attr("data-parent", "#space_panel_collapse_" + i)
            .attr("href", "#space_panel_collapse_" + i)
            .text(spaces[i]);
        spacePanelTitleId.append(space_panel_title_ref);

        // Add the panel collapse div
        var space_panel_collapse = $("<div>")
            .attr("id", "space_panel_collapse_" + i)
            .addClass("panel-collapse")
            .addClass("collapse")
            .addClass("in");
        spacePanelId.append(space_panel_collapse);

        // Retrieve and store the reference
        var spacePanelCollapseId = $("#space_panel_collapse_" + i);

        // Add the body
        var space_panel_body = $("<div>")
            .attr("id", "space_body" + i)
            .addClass("panel-body");
        spacePanelCollapseId.append(space_panel_body);

        // Retrieve and store the reference
        var spaceBodyId = $("#space_body" + i);

        // Display all its projects
        for (var j = 0; j < data[spaces[i]].length; j++) {

            // Build the link
            var project = data[spaces[i]][j];
            var code = project["project"].code;
            var p = $("<p>").text(code).css('cursor', 'pointer').click(
                DATAVIEWER.retrieveProjectInfo(project));

            // Add it
            spaceBodyId.append(p);

        }

    }

};

/**
 * Retrieve the information for the requested project.
 * @param project A project
 */
DataViewer.prototype.retrieveProjectInfo = function(project) {

    return function() {
        DATAVIEWER.prepareDisplayExperiments(project);
    }

};

/**
 * Link to the requested experiment.
 * @param permId Permanent ID of the experiment.
 * @param experiment_type Type of experiment, one of LST_FORTESSA, FACS_ARIA, MICROSCOPY
 * @returns {Function} Callback
 */
DataViewer.prototype.linkToExperiment = function(permId, experiment_type) {

    var section = "";

    if (experiment_type == "LSR_FORTESSA" || experiment_type == "FACS_ARIA" || experiment_type == "INFLUX") {

        section = "webapp-section_bdfacsdiva-viewer";

    } else if (experiment_type == "MICROSCOPY") {

        section = "webapp-section_microscopy-experiment-viewer";

    } else {
        DATAVIEWER.displayStatus("Unknown experiment type! This is a bug! Please report!", "error");
        return function() {return false;};
    }

    return function() {
        window.top.location.hash = "#entity=EXPERIMENT&permId=" + permId +
            "&ui-subtab=" + section + "&ui-timestamp=" + (new Date().getTime());
        return false;
    }

};

/**
 * Checks whether the experiment data is ready to be displayed.
 *
 * If it is, displayExperiments() is called; otherwise, DataModel::retrieveExperimentDataForProject()
 * is called first.
 *
 * @param project Project object.
 */
DataViewer.prototype.prepareDisplayExperiments = function(project) {

    // Clear metaprojects map and ids
    DATAMODEL.microscopyMetaprojectsMap = {};
    DATAMODEL.flowAnalysersMetaprojectsMap = {};
    DATAMODEL.flowSortersMetaprojectsMap = {};
    this.uniqueMicroscopyMetaProjectIds = [];
    this.uniqueFlowAnalysersMetaProjectIds = [];
    this.uniqueFlowSortersMetaProjectIds = [];

    // Clean
    this.hideExperimentPanels();
    this.cleanExperiments();
    this.clearFilters();

    // Check whether the experiment data for current project was already
    // retrieved
    if (! (project.hasOwnProperty("experiments") && project["experiments"] != {})) {

        // Retrieve experiments info and pass again this function for display
        DATAMODEL.retrieveExperimentDataForProject(project, DATAVIEWER.displayExperiments);

    } else {

        // If the experiment data was already available, we display it.
        this.displayExperiments(project, "LSR_FORTESSA");
        this.displayExperiments(project, "FACS_ARIA");
        this.displayExperiments(project, "INFLUX");
        this.displayExperiments(project, "MICROSCOPY");
    }
};

/**
 * Display the data.
 * @param project Project object.
 * @param experimentType string One of "LSR_FORTESSA", "FACS_ARIA", "INFLUX", "MICROSCOPY".
 */
DataViewer.prototype.displayExperiments = function(project, experimentType) {

    // Check!
    if (experimentType != "LSR_FORTESSA" && experimentType != "FACS_ARIA" &&
        experimentType != "INFLUX" && experimentType != "MICROSCOPY") {

        DATAVIEWER.displayStatus("Unknown experiment type! This is a bug! Please report!", "error");
        return;

    }

    // If the project has not be scanned yet, we just return
    if (! project.hasOwnProperty("experiments")) {
        return;
    }

    // Get the id of the experiment class
    var experimentTypePanelGroupDiv, experimentTypePanelBodyDiv;
    if (experimentType == "LSR_FORTESSA") {
        experimentTypePanelGroupDiv = $("#flow_analyzers");
        experimentTypePanelBodyDiv = $("#flow_analyzers_panel_body");
    }
    else if (experimentType == "FACS_ARIA" || experimentType == "INFLUX") {
        experimentTypePanelGroupDiv = $("#flow_sorters");
        experimentTypePanelBodyDiv = $("#flow_sorters_panel_body");
    }
    else if (experimentType == "MICROSCOPY") {
        experimentTypePanelGroupDiv = $("#microscopy");
        experimentTypePanelBodyDiv = $("#microscopy_panel_body");
    } else {

        return;
    }

    // Retrieve the experiments
    var experiments = project["experiments"];

    // Get the requested experiments
    var requested_experiments = experiments[experimentType];
    var requested_exp_property_name = experimentType + "_EXPERIMENT_NAME";
    var requested_exp_descr_property_name =  experimentType + "_EXPERIMENT_DESCRIPTION";
    var requested_exp_descr_property_hostname =  experimentType + "_EXPERIMENT_ACQ_HARDWARE_FRIENDLY_NAME";

    // Add a title
    var nExp =  requested_experiments.length;
    if (nExp > 0) {

        // Display experiments
        for (var i = 0; i < requested_experiments.length; i++) {

            var e = requested_experiments[i]["properties"][requested_exp_property_name];
            var c = requested_experiments[i].code;
            var m = DATAMODEL.resolveMetaproject(requested_experiments[i].metaprojects, experimentType);
            var p = requested_experiments[i].permId;
            var f = "";
            if (requested_experiments[i]["properties"][requested_exp_descr_property_hostname]) {
                // This experiment has the hostname friendly name property associated to it
                f = requested_experiments[i]["properties"][requested_exp_descr_property_hostname];
            }

            // Wrap an experiment in a div
            var experimentContainerDir = $("<div>").addClass("experiment_container");
            experimentTypePanelBodyDiv.append(experimentContainerDir);

            // Add the experiment name with link to the viewer web app
            var link = $("<a>").addClass("experiment").text(e).attr("href", "#").attr("title", c).click(
                DATAVIEWER.linkToExperiment(p, experimentType));
            experimentContainerDir.append(link);

            // Add tags
            var tags = $("<div>").addClass("experiment_tags");
            var tagsStr = "";
            for (var j = 0; j < m.length; j++) {
                if (m[j].name !== undefined && m[j].name != "") {
                    tagsStr = tagsStr + "<span class=\"label label-info tag\">" + m[j].name + "</span>&nbsp;";
                }
            }
            if (tagsStr == "") {
                tagsStr = "<i>No tags assigned.</i>";
            }
            tags.html(tagsStr);
            experimentContainerDir.append(tags);

            var d = requested_experiments[i]["properties"][requested_exp_descr_property_name];
            if (d === undefined || d === "") {
                d = "<i>No description provided.</i>";
            }

            // Display the description
            var q = $("<div>").addClass("experiment_description").html(d);
            experimentContainerDir.append(q);

            // If the hostname friendly name is define, display it
            var fS = "";
            if (f == "") {
                fS = "<i>Acquisition station name unknown.</i>"
            } else {
                fS = "Acquired on " + f + ".";
            }
            var fN = $("<div>").addClass("experiment_hostname").html(fS);
            experimentContainerDir.append(fN);

        }

        // Show the panel group
        experimentTypePanelGroupDiv.show();

    }

    // Display the filters
    this.displayFilters(experimentType);

};

/**
 * Clean the experiment lists.
  */
DataViewer.prototype.cleanExperiments = function() {

    $("#flow_analyzers_panel_body").empty();
    $("#flow_sorters_panel_body").empty();
    $("#microscopy_panel_body").empty();

};

/**
 * Hide experiment panels.
 */
DataViewer.prototype.hideExperimentPanels = function() {

    $("#flow_analyzers").hide();
    $("#flow_sorters").hide();
    $("#microscopy").hide();

};

/**
 * Clear filters.
 */
DataViewer.prototype.clearFilters = function() {

    $("#filters_microscopy").empty();
    $("#filters_flow_analyzers").empty();
    $("#filters_flow_sorters").empty();
};

/**
 * Display filters for current project.
 * @param experimentType Type of the experiment.
 */
DataViewer.prototype.displayFilters = function(experimentType) {

    // Keep track of the tags already shows for this experiment type
    var uniqueMetaProjectIds;
    var metaprojectsMap;

    // Filters div
    var filterDiv;
    if (experimentType == "MICROSCOPY") {
        filterDiv = $("#filters_microscopy");
        uniqueMetaProjectIds = this.uniqueMicroscopyMetaProjectIds;
        metaprojectsMap = DATAMODEL.microscopyMetaprojectsMap;
    } else if (experimentType == "LSR_FORTESSA") {
        filterDiv = $("#filters_flow_analyzers");
        uniqueMetaProjectIds = this.uniqueFlowAnalysersMetaProjectIds;
        metaprojectsMap = DATAMODEL.flowAnalysersMetaprojectsMap;
    } else if (experimentType == "FACS_ARIA" || experimentType == "INFLUX") {
        filterDiv = $("#filters_flow_sorters");
        uniqueMetaProjectIds = this.uniqueFlowSortersMetaProjectIds;
        metaprojectsMap = DATAMODEL.flowSortersMetaprojectsMap;
    } else {
        return;
    }

    var cbDiv, lbDiv, inputObj;
    for (var prop in metaprojectsMap) {

        // Get metaproject's numeric ID in openBIS
        var id = metaprojectsMap[prop].id;

        if ($.inArray(id, uniqueMetaProjectIds) != -1) {
            continue;
        }
        uniqueMetaProjectIds.push(id);

        // Add a filter (checkbox) for current tab
        cbDiv = $("<div>").addClass('checkbox-inline');
        lbDiv = $("<label />").text(metaprojectsMap[prop].name);
        inputObj = $("<input />")
            .attr("type", "checkbox")
            .prop('checked', true)
            .click(function(){ DATAVIEWER.filterExperimentByTag(experimentType); })
            .attr("id", metaprojectsMap[prop].name)
            .attr("value", metaprojectsMap[prop].name);
        lbDiv.append(inputObj);
        cbDiv.append(lbDiv);
        filterDiv.append(cbDiv);

    }

    if ($.inArray("no_tags", uniqueMetaProjectIds) == -1) {

        // Add a filter for "no tags"
        cbDiv = $("<div>").addClass('checkbox-inline');
        lbDiv = $("<label />").text("No tags");
        inputObj = $("<input />")
            .attr("type", "checkbox")
            .prop('checked', true)
            .click(function () {
                DATAVIEWER.filterExperimentByTag(experimentType);
            })
            .attr("id", "no_tags")
            .attr("value", "na_tags");
        lbDiv.append(inputObj);
        cbDiv.append(lbDiv);
        filterDiv.append(cbDiv);

        // Add it to the list of already added tags
        uniqueMetaProjectIds.push("no_tags");
    }

};

/**
 * Only show experiments for selected tas.
 */
DataViewer.prototype.filterExperimentByTag = function(experimentType) {

    // Filters div
    var filterDiv, experimentContainers;
    if (experimentType == "MICROSCOPY") {
        filterDiv = $("#filters_microscopy");
        experimentContainers = $("#microscopy .experiment_container");
    } else if (experimentType == "LSR_FORTESSA") {
        filterDiv = $("#filters_flow_analyzers");
        experimentContainers = $("#flow_analyzers .experiment_container");
    } else if (experimentType == "FACS_ARIA" || experimentType == "INFLUX") {
        filterDiv = $("#filters_flow_sorters");
        experimentContainers = $("#flow_sorters .experiment_container");
    } else {
        return;
    }

    // Get all tag checkboxes
    var tagCheckBoxes = filterDiv.find(':checkbox');

    var tagChecked = [];
    var tagNames = [];
    for (var i = 0; i < tagCheckBoxes.length; i++) {
        tagChecked.push(tagCheckBoxes[i].checked);
        tagNames.push(tagCheckBoxes[i].id);
    }

    // Keep track of the "no_tags" filter
    var indexNoTag = tagNames.indexOf("no_tags");

    // Go over all experiments and filter by assigned tags
    for (var j = 0; j < experimentContainers.length; j++) {

        // Retrieve the (real) tags for current experiment
        var tagsForExp = $(experimentContainers[j]).find("span");

        if (tagsForExp.length == 0) {

            if (indexNoTag != -1) {

                if (tagChecked[indexNoTag] == true) {
                    $(experimentContainers[j]).show();
                } else {
                    $(experimentContainers[j]).hide();
                }

                // Go to next experiment
                continue;
            }
        }

        // If any of its tag is checked, we display it; otherwise
        // we hide it.
        var show = false;
        $(tagsForExp).each(function() {

            var tagName = $(this).text();

            var index = tagNames.indexOf(tagName);
            if (index != -1) {
               if (tagChecked[index] == true) {
                    show = true;
               }
            }

            if (show == true) {
                $(experimentContainers[j]).show();
            } else {
                $(experimentContainers[j]).hide();
            }

        });
    }

};
