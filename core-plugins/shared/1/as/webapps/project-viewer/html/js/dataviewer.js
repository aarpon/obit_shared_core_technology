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

    // Display the status
    $("#status").empty();

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

    status = "<div class=\"alert alert-" + cls + " alert-dismissable\">" +
        status + "</div>";
    $("#status").html(status);

};

/**
 * Display the data.
 * @param projects array of projects.
 */
DataViewer.prototype.displayProjects = function(data) {

    // Display the status
    $("#projects").empty();

    // Get the spaces
    var spaces = Object.keys(data);

    for (var i = 0; i < spaces.length; i++) {

        // Display the space
        var s = $("<div>").addClass("space").text(spaces[i]);
        $("#projects").append(s);

        // Display all its projects
        for (var j = 0; j < data[spaces[i]].length; j++) {

            var project = data[spaces[i]][j];

            var code = project["project"].code;

            var p = $("<div>").addClass("project").text(code).css('cursor', 'pointer').click(
                DATAVIEWER.retrieveProjectInfo(project));

            $("#projects").append(p);

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
 * Checks whether the experiment data is ready to be displayed.
 *
 * If it is, displayExperiments() is called; otherwise, DataModel::retrieveExperimentDataForProject()
 * is called first.
 *
 * @param projects array of projects.
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
 * @param projects array of projects.
 */
DataViewer.prototype.displayExperiments = function(project, experimentType) {

    // Check!
    if (experimentType != "LSR_FORTESSA" && experimentType != "FACS_ARIA" && experimentType != "MICROSCOPY") {

        DATAVIEWER.displayStatus("Unknown experiment type! This is a big! Please report!", "error");
        return;

    }

    // Get and store some divs
    var experiments_div = $("#experiments")

    // Clear the experiments div
    experiments_div.empty();

    // If the project has not be scanned yet, we just return
    if (! project.hasOwnProperty("experiments")) {
        return;
    }

    // Retrieve the experiments
    var experiments = project["experiments"];

    // Get the requested experiments
    var requested_exp_div = $("#" + experimentType.toLowerCase());
    var requested_experiments = experiments[experimentType];
    var requested_exp_property_name = experimentType + "_EXPERIMENT_NAME";
    var requested_exp_descr_property_name =  experimentType + "_EXPERIMENT_DESCRIPTION";

    // Add a title
    var nExp =  requested_experiments.length;
    if (nExp > 0) {
        var p = $("<div>").addClass("experiment_type").text(experimentType);
        requested_exp_div.append(p);

        // Display experiments
        for (var i = 0; i < requested_experiments.length; i++) {

            var e = requested_experiments[i]["properties"][requested_exp_property_name];
            var d = requested_experiments[i]["properties"][requested_exp_descr_property_name];
            if (d == "") {
                d = "No description provided.";
            }

            // Display
            var p = $("<div>").addClass("experiment").text(e);
            requested_exp_div.append(p);
            var q = $("<div>").addClass("experiment_description").text(d);
            requested_exp_div.append(q);

        }
    }

};

/**
 * Clean the experiment lists.
  */
DataViewer.prototype.cleanExperiments = function() {

    $("#experiments").empty();
    $("#lsr_fortessa").empty();
    $("#facs_aria").empty();
    $("#microscopy").empty();

};
