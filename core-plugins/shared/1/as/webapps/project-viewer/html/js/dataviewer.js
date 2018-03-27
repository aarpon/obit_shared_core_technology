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

    // Machine names
    this.uniqueMicroscopyMachineNames = [];
    this.uniqueFlowAnalysersMachineNames = [];
    this.uniqueFlowSortersMachineNames = [];


    // Keep track of currently selected projects
    this.currentProject = null;
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
 * @param experiment_type One of the accepted experiment types.
 * @see DataModel.isValidExperiment()
 * @returns {Function} Callback
 */
DataViewer.prototype.linkToExperiment = function(permId, experiment_type) {

    var section = "";

    if (DATAMODEL.isFlowExperiment(experiment_type)) {

        section = "webapp-section_flow-viewer";

    } else if (DATAMODEL.isMicroscopyExperiment(experiment_type)) {

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

    // Clear metaprojects map and ids, and machine names
    DATAMODEL.microscopyMetaprojectsMap = {};
    DATAMODEL.flowAnalysersMetaprojectsMap = {};
    DATAMODEL.flowSortersMetaprojectsMap = {};
    this.uniqueMicroscopyMetaProjectIds = [];
    this.uniqueFlowAnalysersMetaProjectIds = [];
    this.uniqueFlowSortersMetaProjectIds = [];
    this.uniqueMicroscopyMachineNames = [];
    this.uniqueFlowAnalysersMachineNames = [];
    this.uniqueFlowSortersMachineNames = [];

    // Clean
    this.hideExperimentPanels();
    this.cleanExperiments();

    // Check whether the experiment data for current project was already
    // retrieved
    if (! (project.hasOwnProperty("experiments") && project["experiments"] !== {})) {

        // Retrieve experiments info and pass again this function for display
        DATAMODEL.retrieveExperimentDataForProject(project, DATAVIEWER.displayExperiments);

    } else {

        // If the experiment data is already available, we display it.
        this.displayExperiments(project, "LSR_FORTESSA");
        this.displayExperiments(project, "FACS_ARIA");
        this.displayExperiments(project, "INFLUX");
        this.displayExperiments(project, "S3E");
        this.displayExperiments(project, "MOFLO_XDP");
        this.displayExperiments(project, "MICROSCOPY");
    }

    // Store project as currently active one
    this.currentProject = project;

};

/**
 * (Re)display all data for project.
 * @param project Project object.
 */
DataViewer.prototype.reDisplayAllExperimentsForProject = function(project) {

    // Clean
    this.hideExperimentPanels();
    this.cleanExperiments();

    // If the experiment data is already available, we display it.
    this.displayExperiments(project, "LSR_FORTESSA");
    this.displayExperiments(project, "FACS_ARIA");
    this.displayExperiments(project, "INFLUX");
    this.displayExperiments(project, "S3E");
    this.displayExperiments(project, "MOFLO_XDP");
    this.displayExperiments(project, "MICROSCOPY");
};

/**
 * Display the data.
 * @param project Project object.
 * @param experimentType string One of the accepted experiment types.
 * @see DataModel.isValidExperiment().
 */
DataViewer.prototype.displayExperiments = function(project, experimentType) {

    // Do nothing if the project is not set. It can happen if some
    // callbacks (like experiment sorting) are triggered.
    if (project == null) {
        return;
    }

    // Check!
    if (! DATAMODEL.isValidExperiment(experimentType)) {

        DATAVIEWER.displayStatus("Unknown experiment type! This is a bug! Please report!", "error");
        return;

    }

    // If the project has not be scanned yet, we just return
    if (! project.hasOwnProperty("experiments")) {
        return;
    }

    // Get the id of the experiment class
    var experimentTypePanelGroupDiv, experimentTypePanelBodyDiv;
    if (DATAMODEL.isFlowAnalyzerExperiment(experimentType)) {
        experimentTypePanelGroupDiv = $("#flow_analyzers");
        experimentTypePanelBodyDiv = $("#flow_analyzers_panel_body");
    }
    else if (DATAMODEL.isFlowSorterExperiment(experimentType)) {
        experimentTypePanelGroupDiv = $("#flow_sorters");
        experimentTypePanelBodyDiv = $("#flow_sorters_panel_body");
    }
    else if (DATAMODEL.isMicroscopyExperiment(experimentType)) {
        experimentTypePanelGroupDiv = $("#microscopy");
        experimentTypePanelBodyDiv = $("#microscopy_panel_body");
    } else {

        return;
    }

    // Machine names per type
    var uniqueMachineNames;
    if (DATAMODEL.isFlowAnalyzerExperiment(experimentType)) {
        uniqueMachineNames = this.uniqueFlowAnalysersMachineNames;
    }
    else if (DATAMODEL.isFlowSorterExperiment(experimentType)) {
        uniqueMachineNames = this.uniqueFlowSortersMachineNames;
    }
    else if (DATAMODEL.isMicroscopyExperiment(experimentType)) {
        uniqueMachineNames = this.uniqueMicroscopyMachineNames;
    } else {

        return;
    }

    // Retrieve the experiments
    var experiments = project["experiments"];

    // Get the requested experiments
    var requested_experiments = experiments[experimentType];
    var requested_exp_property_name = experimentType + "_EXPERIMENT_NAME";
    var requested_exp_descr_property_name = experimentType + "_EXPERIMENT_DESCRIPTION";
    var requested_exp_descr_property_hostname = experimentType + "_EXPERIMENT_ACQ_HARDWARE_FRIENDLY_NAME";

    // Sorting
    var requested_sorting_option = $('input[name=sort_option]:checked', '#exp_sorting_form').val();

    // Add a title
    var nExp = requested_experiments.length;
    if (nExp > 0) {

        if (requested_sorting_option === "1") {
            // Sort them by experiment name (ascending)
            requested_experiments.sort(function(a, b) {
                var textA = a["properties"][requested_exp_property_name].toUpperCase();
                var textB = b["properties"][requested_exp_property_name].toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });
        } else if (requested_sorting_option === "2") {
            // Sort them by experiment name (descending)
            requested_experiments.sort(function(a, b) {
                var textA = a["properties"][requested_exp_property_name].toUpperCase();
                var textB = b["properties"][requested_exp_property_name].toUpperCase();
                return (textB < textA) ? -1 : (textB > textA) ? 1 : 0;
            });
        } else if (requested_sorting_option === "3") {
            // Sort them by registration date name (newest first)
            requested_experiments.sort(function(a, b) {
                var dateA = a["registrationDetails"]["registrationDate"];
                var dateB = b["registrationDetails"]["registrationDate"];
                return (dateB < dateA) ? -1 : (dateB > dateA) ? 1 : 0;
            });
        } else {
            // Sort them by registration date name (oldest first)
            requested_experiments.sort(function(a, b) {
                var dateA = a["registrationDetails"]["registrationDate"];
                var dateB = b["registrationDetails"]["registrationDate"];
                return (dateA < dateB) ? -1 : (dateA > dateB) ? 1 : 0;
            });
        }

        // Display experiments
        for (var i = 0; i < requested_experiments.length; i++) {

            var e = requested_experiments[i]["properties"][requested_exp_property_name];
            var c = requested_experiments[i].code;
            var m = DATAMODEL.resolveMetaproject(requested_experiments[i].metaprojects,
                requested_experiments, experimentType);
            var p = requested_experiments[i].permId;
            var f = "";
            if (requested_experiments[i]["properties"][requested_exp_descr_property_hostname]) {
                // This experiment has the hostname friendly name property associated to it
                f = requested_experiments[i]["properties"][requested_exp_descr_property_hostname];
            }

            // Push the machine name if it is not in the map yet
            if (f !== "" && uniqueMachineNames.indexOf(f) === -1) {
                uniqueMachineNames.push(f);
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
                if (m !== null && m[j].name !== undefined && m[j].name !== "") {
                    tagsStr = tagsStr + "<span class=\"label label-info tag\">" + m[j].name + "</span>&nbsp;";
                }
            }
            if (tagsStr === "") {
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

            // Hostname friendly name
            var fS;
            if (f === "") {
                f = "Unknown";
            }
            fS = "Acquired on <span class=\"label label-success machineName\">" + f + "</span>";
            var fN = $("<div>").addClass("experiment_hostname").html(fS);
            experimentContainerDir.append(fN);
        }

        // Show the panel group
        experimentTypePanelGroupDiv.show();

    }

    // Display the tag filters
    this.displayTagFilters(experimentType);

    // Display the machine name filters
    this.displayMachineNameFilters(experimentType);

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
 * Display filters for current project.
 * @param experimentType Type of the experiment.
 */
DataViewer.prototype.displayTagFilters = function(experimentType) {

    // Keep track of the tags already shows for this experiment type
    var uniqueMetaProjectIds;
    var metaprojectsMap;

    // Filters div
    var filterDiv;
    if (DATAMODEL.isMicroscopyExperiment(experimentType)) {
        filterDiv = $("#filters_microscopy");
        uniqueMetaProjectIds = this.uniqueMicroscopyMetaProjectIds;
        metaprojectsMap = DATAMODEL.microscopyMetaprojectsMap;
    } else if (DATAMODEL.isFlowAnalyzerExperiment(experimentType)) {
        filterDiv = $("#filters_flow_analyzers");
        uniqueMetaProjectIds = this.uniqueFlowAnalysersMetaProjectIds;
        metaprojectsMap = DATAMODEL.flowAnalysersMetaprojectsMap;
    } else if (DATAMODEL.isFlowSorterExperiment(experimentType)) {
        filterDiv = $("#filters_flow_sorters");
        uniqueMetaProjectIds = this.uniqueFlowSortersMetaProjectIds;
        metaprojectsMap = DATAMODEL.flowSortersMetaprojectsMap;
    } else {
        return;
    }

    // Find the tag div and clear it
    var tagDiv = filterDiv.find("div.tag_list");
    tagDiv.empty();

    var cbDiv, lbDiv, inputObj;
    for (var prop in metaprojectsMap) {

        // Get metaproject's numeric ID in openBIS
        var id = metaprojectsMap[prop].id;

        if ($.inArray(id, uniqueMetaProjectIds) === -1) {
            uniqueMetaProjectIds.push(id);
        }

        // Add a filter (checkbox) for current tag
        cbDiv = $("<div>")
            .addClass('checkbox-inline');
        lbDiv = $("<label />")
            .text(metaprojectsMap[prop].name);
        inputObj = $("<input />")
            .attr("type", "checkbox")
            .prop('checked', true)
            .click(function () {
                DATAVIEWER.filterExperimentByUserSelection(experimentType);
            })
            .attr("id", metaprojectsMap[prop].name)
            .attr("value", metaprojectsMap[prop].name);
        lbDiv.append(inputObj);
        cbDiv.append(lbDiv);
        tagDiv.append(cbDiv);

    }

    // Add a filter for "no tags"
    cbDiv = $("<div>").addClass('checkbox-inline');
    lbDiv = $("<label />").text("No tags");
    inputObj = $("<input />")
        .attr("type", "checkbox")
        .prop('checked', true)
        .click(function () {
            DATAVIEWER.filterExperimentByUserSelection(experimentType);
        })
        .attr("id", "no_tags")
        .attr("value", "no_tags");
    lbDiv.append(inputObj);
    cbDiv.append(lbDiv);
    tagDiv.append(cbDiv);

    // Add it to the list of already added tags
    uniqueMetaProjectIds.push("no_tags");

};

/**
 * Display machine names for current project.
 * @param experimentType Type of the experiment.
 */
DataViewer.prototype.displayMachineNameFilters = function(experimentType) {

    // Keep track of the tags already shows for this experiment type
    var uniqueMachineNames;

    // Filters div
    var filterDiv;
    if (DATAMODEL.isMicroscopyExperiment(experimentType)) {
        filterDiv = $("#filters_microscopy");
        uniqueMachineNames = this.uniqueMicroscopyMachineNames;
    } else if (DATAMODEL.isFlowAnalyzerExperiment(experimentType)) {
        filterDiv = $("#filters_flow_analyzers");
        uniqueMachineNames = this.uniqueFlowAnalysersMachineNames;
    } else if (DATAMODEL.isFlowSorterExperiment(experimentType)) {
        filterDiv = $("#filters_flow_sorters");
        uniqueMachineNames = this.uniqueFlowSortersMachineNames;
    } else {
        return;
    }

    // Find the machine name div and empty it
    var machineNamesDiv = filterDiv.find("div.machineName_list");
    machineNamesDiv.empty();

    var cbDiv, lbDiv, inputObj;
    for (var i = 0; i < uniqueMachineNames.length; i++) {

        // Get current machine name
        var machineName = uniqueMachineNames[i];

        // Add a filter (checkbox) for current tab
        cbDiv = $("<div>")
            .addClass('checkbox-inline');
        lbDiv = $("<label />")
            .text(machineName);
        inputObj = $("<input />")
            .attr("type", "checkbox")
            .prop('checked', true)
            .click(function () {
                DATAVIEWER.filterExperimentByUserSelection(experimentType);
            })
            .attr("id", machineName)
            .attr("value", machineName);
        lbDiv.append(inputObj);
        cbDiv.append(lbDiv);
        machineNamesDiv.append(cbDiv);
    }

    // Add a filter for Unknown
    cbDiv = $("<div>").addClass('checkbox-inline');
    lbDiv = $("<label />").text("Unknown");
    inputObj = $("<input />")
        .attr("type", "checkbox")
        .prop('checked', true)
        .click(function () {
            DATAVIEWER.filterExperimentByUserSelection(experimentType);
        })
        .attr("id", "Unknown")
        .attr("value", "Unknown");
    lbDiv.append(inputObj);
    cbDiv.append(lbDiv);
    machineNamesDiv.append(cbDiv);

};

/**
 * Filter experiment by tags and machine name.
 * @param experimentType Type of the experiment.
 */
DataViewer.prototype.filterExperimentByUserSelection = function(experimentType) {

    // Filters div
    var filterDiv, experimentContainers;
    if (DATAMODEL.isMicroscopyExperiment(experimentType)) {
        filterDiv = $("#filters_microscopy");
        experimentContainers = $("#microscopy .experiment_container");
    } else if (DATAMODEL.isFlowAnalyzerExperiment(experimentType)) {
        filterDiv = $("#filters_flow_analyzers");
        experimentContainers = $("#flow_analyzers .experiment_container");
    } else if (DATAMODEL.isFlowSorterExperiment(experimentType)) {
        filterDiv = $("#filters_flow_sorters");
        experimentContainers = $("#flow_sorters .experiment_container");
    } else {
        return;
    }

    // Get all tag checkboxes
    var tagCheckBoxes = filterDiv.find("div.tag_list").find(':checkbox');

    var tagChecked = [];
    var tagNames = [];
    for (var i = 0; i < tagCheckBoxes.length; i++) {
        tagChecked.push(tagCheckBoxes[i].checked);
        tagNames.push(tagCheckBoxes[i].id);
    }

    // Keep track of the "no_tags" filter
    var indexNoTag = tagNames.indexOf("no_tags");

    // Get all machine name checkboxes
    var machineNameCheckBoxes = filterDiv.find("div.machineName_list").find(':checkbox');

    var machineNameChecked = [];
    var machineNames = [];
    for (i = 0; i < machineNameCheckBoxes.length; i++) {
        machineNameChecked.push(machineNameCheckBoxes[i].checked);
        machineNames.push(machineNameCheckBoxes[i].id);
    }

    // Keep track of the "Unknown" machine name.
    var indexNoMachineName = machineNames.indexOf("Unknown");

    for (var j = 0; j < experimentContainers.length; j++) {

        // Keep track of what is enable and what is disable to decide
        // whether to show or hide the experiment.
        var show = false;

        // Go over all experiments and filter by assigned tags
        var tagsForExp = $(experimentContainers[j])
            .find(".experiment_tags")
            .find("span.tag");

        if (tagsForExp.length === 0) {

            if (indexNoTag !== -1) {

                if (tagChecked[indexNoTag] === true) {
                    show = true;
                }
            }
        } else {

            // If any of its tags is checked, we display it.
            $(tagsForExp).each(function () {

                var tagName = $(this).text();

                var index = tagNames.indexOf(tagName);
                if (index !== -1) {
                    if (tagChecked[index] === true) {
                        show = true;
                    }
                }
            });
        }

        // Go over all experiments and filter by machine name

        // Retrieve the (real) tags for current experiment
        var machineName = $(experimentContainers[j])
            .find(".experiment_hostname")
            .find("span.machineName")
            .text();

        if (machineName.localeCompare("Unknown") === 0) {
            if (machineNameChecked[indexNoMachineName] === true) {
                show = true;
            }
        } else {

            // Check if the machine is enabled
            var index = machineNames.indexOf(machineName);
            if (index !== -1) {
                if (machineNameChecked[index] === true) {
                    show = true;
                }
            }
        }

        // Now we can finally show or hide the experiment
        if (show === true) {
            $(experimentContainers[j]).show();
        } else {
            $(experimentContainers[j]).hide();
        }

    }

};
