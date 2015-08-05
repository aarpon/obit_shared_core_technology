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
 * Return a description of the acquisition hardware to be associated to the experiments.
 * @param experiment_type Type of experiment, one of LST_FORTESSA, FACS_ARIA, MICROSCOPY
 * @returns string Hardware-dependent experiment description.
 */
DataViewer.prototype.getHardwareDependentExperimentDescription = function(experiment_type) {

    var description = "";

    if (experiment_type == "LSR_FORTESSA") {

        description = "Flow experiments (BD LSR Fortessa)";

    } else if (experiment_type == "FACS_ARIA") {

        description = "Flow experiments (BD FACS Aria)";

    } else if (experiment_type == "MICROSCOPY") {

        description = "Microscopy experiments (various instruments)";

    } else {
        DATAVIEWER.displayStatus("Unknown experiment type! This is a bug! Please report!", "error");
        description = ""
    }

    return description;
};

/**
 * Link to the requested experiment.
 * @param permId Permanent ID of the experiment.
 * @param experiment_type Type of experiment, one of LST_FORTESSA, FACS_ARIA, MICROSCOPY
 * @returns {Function} Callback
 */
DataViewer.prototype.linkToExperiment = function(permId, experiment_type) {

    var section = "";

    if (experiment_type == "LSR_FORTESSA" || experiment_type == "FACS_ARIA") {

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

    // Check whether the experiment data for current project was already
    // retrieved
    if (! (project.hasOwnProperty("experiments") && project["experiments"] != {})) {

        // Retrieve experiments info and pass again this function for display
        DATAMODEL.retrieveExperimentDataForProject(project, DATAVIEWER.displayExperiments);

        // Return here if we launched the retrieval of experiment data
        return;
    }

    // If the experiment data was already available, we display it.
    this.cleanExperiments();
    this.displayExperiments(project, "LSR_FORTESSA");
    this.displayExperiments(project, "FACS_ARIA");
    this.displayExperiments(project, "MICROSCOPY");
};

/**
 * Display the data.
 * @param project Project object.
 * @param experimentType string One of "LSR_FORTESSA", "FACS_ARIA", "MICROSCOPY".
 */
DataViewer.prototype.displayExperiments = function(project, experimentType) {

    // Check!
    if (experimentType != "LSR_FORTESSA" && experimentType != "FACS_ARIA" && experimentType != "MICROSCOPY") {

        DATAVIEWER.displayStatus("Unknown experiment type! This is a bug! Please report!", "error");
        return;

    }

    // If the project has not be scanned yet, we just return
    if (! project.hasOwnProperty("experiments")) {
        return;
    }

    // Use the lower case experiment type as a key
    var experimentTypeKey = experimentType.toLowerCase();

    // Retrieve the experiments
    var experiments = project["experiments"];

    // Get the requested experiments
    var requested_exp_div = $("#" + experimentTypeKey);
    var requested_experiments = experiments[experimentType];
    var requested_exp_property_name = experimentType + "_EXPERIMENT_NAME";
    var requested_exp_descr_property_name =  experimentType + "_EXPERIMENT_DESCRIPTION";

    var experimentDescription = DATAVIEWER.getHardwareDependentExperimentDescription(experimentType);

    // Add a title
    var nExp =  requested_experiments.length;
    if (nExp > 0) {

        // Create the panel group
        var panel_group = $("<div>")
            .addClass("panel-group")
            .attr("id", experimentTypeKey + "_group");
        requested_exp_div.append(panel_group);

        // Get and retrieve the reference
        var panelGroupId = $("#" + experimentTypeKey + "_group");

        // Create a panel for the experiments
        var experiments_type_panel = $("<div>")
            .attr("id", experimentTypeKey + "_panel")
            .addClass("panel")
            .addClass("panel-success");

        // Add it to the group
        panelGroupId.append(experiments_type_panel);

        // Retrieve and store the reference
        var experimentTypeId = $("#" + experimentTypeKey + "_panel");

        // Add the heading
        var experiments_type_panel_heading = $("<div>")
            .attr("id", experimentTypeKey + "_heading")
            .addClass("panel-heading");
        experimentTypeId.append(experiments_type_panel_heading);

        // Retrieve and store the reference
        var experimentTypeHeadingId = $("#" + experimentTypeKey + "_heading");

        // Add the title
        var experiments_type_panel_title = $("<h4>")
            .attr("id", experimentTypeKey + "_heading_title")
            .addClass("panel-title");
        experimentTypeHeadingId.append(experiments_type_panel_title);

        // Get and store reference
        var experimentTypePanelTitleId = $("#" + experimentTypeKey + "_heading_title");

        var experiments_type_panel_title_ref = $("<a>")
            .attr("data-toggle", "collapse")
            .attr("data-parent", "#" + experimentTypeKey + "_panel_collapse")
            .attr("href", "#" + experimentTypeKey + "_panel_collapse")
            .text(experimentDescription);
        experimentTypePanelTitleId.append(experiments_type_panel_title_ref);

        // Add the panel collapse div
        var experiments_type_panel_collapse = $("<div>")
            .attr("id", experimentTypeKey + "_panel_collapse")
            .addClass("panel-collapse")
            .addClass("collapse")
            .addClass("in");
        experimentTypeId.append(experiments_type_panel_collapse);

        // Retrieve and store the reference
        var experimentTypePanelCollapseId = $("#" + experimentTypeKey + "_panel_collapse");

        // Add the body
        var experiments_type_panel_body = $("<div>")
            .attr("id", experimentTypeKey + "_panel_body")
            .addClass("panel-body");
        experimentTypePanelCollapseId.append(experiments_type_panel_body);

        // Retrieve and store the reference
        var experimentTypePanelBodyId = $("#" + experimentTypeKey + "_panel_body");

        // Display experiments
        for (var i = 0; i < requested_experiments.length; i++) {

            var e = requested_experiments[i]["properties"][requested_exp_property_name];
            var c = requested_experiments[i].code;
            var m = requested_experiments[i].metaprojects;
            var p = requested_experiments[i].permId;

            // Add the experiment name with link to the viewer web app
            var link = $("<a>").addClass("experiment").text(e).attr("href", "#").attr("title", c).click(
                DATAVIEWER.linkToExperiment(p, experimentType));
            experimentTypePanelBodyId.append(link);

            // Add tags
            var tags = $("<div>").addClass("experiment_tags");
            var tagsStr = "";
            for (var j = 0; j < m.length; j++) {
                if (m[j].name !== undefined && m[j].name != "") {
                    tagsStr = tagsStr + "<span class=\"label label-info\">" + m[j].name + "</span>&nbsp;";
                }
            }
            if (tagsStr == "") {
                tagsStr = "<i>No tags assigned.</i>";
            }
            tags.html(tagsStr);
            experimentTypePanelBodyId.append(tags);

            var d = requested_experiments[i]["properties"][requested_exp_descr_property_name];
            if (d === undefined || d === "") {
                d = "<i>No description provided.</i>";
            }

            // Display the description
            var q = $("<div>").addClass("experiment_description").html(d);
            experimentTypePanelBodyId.append(q);

        }
    }

};

/**
 * Clean the experiment lists.
  */
DataViewer.prototype.cleanExperiments = function() {

    $("#lsr_fortessa").empty();
    $("#facs_aria").empty();
    $("#microscopy").empty();

};
