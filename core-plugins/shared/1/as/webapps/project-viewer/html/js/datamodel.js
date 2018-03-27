/**
 * DataModel class
 * 
 * @author Aaron Ponti
 *
 */


/**
 * Define a model class to access all project related information.
 *
 *  The Project Viewer currently recognizes only the experiment types from the microscopy
 *  and flow core technologies. However, it cannot know in advance which core technologies
 *  are active. For this reason, the web app will silently ignore errors returned from the
 *  server when trying to access experiment types that are not registered.
 *
 */
function DataModel() {

    "use strict";

    // Create a context object to access the context information
    this.context = new openbisWebAppContext();

    // Create an OpenBIS facade to call JSON RPC services
    this.openbisServer = new openbis("/openbis");

    // Reuse the current sessionId that we received in the context for
    // all the facade calls
    this.openbisServer.useSession(this.context.getSessionId());

    // Store the data
    this.data = [];

    // Map of the metaprojects references
    this.microscopyMetaprojectsMap = {};
    this.flowAnalysersMetaprojectsMap = {};
    this.flowSortersMetaprojectsMap = {};

    // Retrieve all projects
    this.openbisServer.listProjects(function(response) {
        if (response.error) {

            // Make sure that the data property is empty
            DATAMODEL.data = [];

            // Report the error
            if (DATAMODEL.openbisServer.getSession() == null) {
                DATAVIEWER.displayStatus("Your session has expired. Please log in to openBIS and try again.", "error");
            } else {
                DATAVIEWER.displayStatus("Could not retrieve the list of projects!", "error");
            }

        } else {

            // Build the data structure
            DATAMODEL.initDataStructure(response.result);

        }
    });

}

/**
 * Resolve a metaproject when a reference is passed
 */
DataModel.prototype.resolveMetaproject = function(expMetaprojects, experiments, experimentType) {

    // If no metaprojects, return the empty object and stop here
    if (expMetaprojects.length === 0) {
        return expMetaprojects;
    }

    // Reference to the correct map (per experiment type)
    var metaprojectsMap;

    // Filters div
    if (this.isMicroscopyExperiment(experimentType)) {
        metaprojectsMap = this.microscopyMetaprojectsMap;
    } else if (this.isFlowAnalyzerExperiment(experimentType)) {
        metaprojectsMap = this.flowAnalysersMetaprojectsMap;
    } else if (this.isFlowSorterExperiment(experimentType)) {
        metaprojectsMap = this.flowSortersMetaprojectsMap;
    } else {
        return;
    }

    // Process all metaprojects
    for (var i = 0; i < expMetaprojects.length; i++) {

        // If valid metaproject, store it and return it
        if (expMetaprojects[i]['@type'] &&  expMetaprojects[i]['@type'].localeCompare("Metaproject") === 0) {

            // Store the metaproject for future lookup
            metaprojectsMap[expMetaprojects[i]['id']] = expMetaprojects[i];

            // Go to the next metaproject
            continue;
        }

        // If id (reference), retrieve stored metaproject and replace the id
        if (typeof(expMetaprojects[i]) === "number") {

            // We need to find the other experiment metaproject that has an @id corresponding
            // to this integer points.
            var mp = this.metaProjectFromID(expMetaprojects[i], experiments);

            if (mp !== null) {

                // Store the metaproject for future lookup
                expMetaprojects[i] = mp;
                metaprojectsMap[mp['id']] = mp;


            } else {

                console.log("Error! Could not find a match for metaproject with @id = " + expMetaprojects[i] + "!");
            }

            // Go to the next metaproject
            continue;
        }

        return null;
    }

    // Return the updated metaproject array.
    return expMetaprojects;

};

/**
 * Resolve metaproject object from @id stored in a JSON file/
 * @param id Id of the metaproject.
 * @param experiments Array of experiments as returned by openbisServer.listExperiments(project)
 * @returns metaproject object or null if not found.
 */
DataModel.prototype.metaProjectFromID = function(id, experiments) {

    for (var i = 0; i < experiments.length; i++) {

        for (var j = 0; j < experiments[i].metaprojects.length; j++) {

            if (typeof(experiments[i].metaprojects[j]) !== "number") {
                if (experiments[i].metaprojects[j]['@id'] === id) {
                    return experiments[i].metaprojects[j];
                }
            }
        }
    }

    return null;
};

/**
 * Initialize the data structure with space and project information and
 * display it using the DataViewer.
 * @param projects array of projects.
 */
DataModel.prototype.initDataStructure = function(projects) {

    // Go over all projects and rearrange them per space
    for (var i = 0; i < projects.length; i++) {

        // Get the space code
        var spaceCode = projects[i].spaceCode;

        // Is the space already in the data array?
        if (! DATAMODEL.data.hasOwnProperty(spaceCode)) {
            DATAMODEL.data[spaceCode] = [];
        }

        // Add the project object. We will populate it later on
        // demand with experiment information.
        var project = {};
        project['project'] = projects[i];
        DATAMODEL.data[spaceCode].push(project);
    }

    // Now display the data
    DATAVIEWER.displayProjects(DATAMODEL.data);

};

/**
 * Retrieve experiment info for given project.
 * @param project object.
 * @param function to be called with the result of the retrieval (most likely a display function).
 */
DataModel.prototype.retrieveExperimentDataForProject = function(project) {

    // Make sure there are no experiments yet
    project['experiments'] = {};

    // Clean the UI
    DATAVIEWER.cleanExperiments();

    // We now retrieve the experiments of all supported types in parallel.

    // Retrieve the LSR_FORTESSA_EXPERIMENT information for current project
    this.openbisServer.listExperiments([project["project"]],
        "LSR_FORTESSA_EXPERIMENT", function(response) {

        if (response.error) {
            // The experiment type LSR_FORTESSA_EXPERIMENT is not registered.
            // We ignore it.
        } else {

            project["experiments"]["LSR_FORTESSA"] = response.result;
            DATAVIEWER.displayExperiments(project, "LSR_FORTESSA");

        }
    });

    // Retrieve the FACS_ARIA_EXPERIMENT information for current project
    this.openbisServer.listExperiments([project["project"]],
        "FACS_ARIA_EXPERIMENT", function(response) {

            if (response.error) {
                // The experiment type FACS_ARIA_EXPERIMENT is not registered.
                // We ignore it.
            } else {

                project["experiments"]["FACS_ARIA"] = response.result;
                DATAVIEWER.displayExperiments(project, "FACS_ARIA");

            }
        });

    // Retrieve the INFLUX_EXPERIMENT information for current project
    this.openbisServer.listExperiments([project["project"]],
        "INFLUX_EXPERIMENT", function(response) {

            if (response.error) {
                // The experiment type INFLUX_EXPERIMENT is not registered.
                // We ignore it.
            } else {

                project["experiments"]["INFLUX"] = response.result;
                DATAVIEWER.displayExperiments(project, "INFLUX");

            }
        });

    // Retrieve the S3E_EXPERIMENT information for current project
    this.openbisServer.listExperiments([project["project"]],
        "S3E_EXPERIMENT", function(response) {

            if (response.error) {
                // The experiment type INFLUX_EXPERIMENT is not registered.
                // We ignore it.
            } else {

                project["experiments"]["S3E"] = response.result;
                DATAVIEWER.displayExperiments(project, "S3E");

            }
        });

    // Retrieve the S3E_EXPERIMENT information for current project
    this.openbisServer.listExperiments([project["project"]],
        "MOFLO_XDP_EXPERIMENT", function(response) {

            if (response.error) {
                // The experiment type INFLUX_EXPERIMENT is not registered.
                // We ignore it.
            } else {

                project["experiments"]["MOFLO_XDP"] = response.result;
                DATAVIEWER.displayExperiments(project, "MOFLO_XDP");

            }
        });

    // Retrieve the MICROSCOPY_EXPERIMENT information for current project
    this.openbisServer.listExperiments([project["project"]],
        "MICROSCOPY_EXPERIMENT", function(response) {

            if (response.error) {
                // The experiment type MICROSCOPY_EXPERIMENT is not registered.
                // We ignore it.
            } else {

                project["experiments"]["MICROSCOPY"] = response.result;
                DATAVIEWER.displayExperiments(project, "MICROSCOPY");

            }
        });
};

/**
 * Checks whether the experiment type is valid and recognized by the app.
 * @param experimentType experiment type
 * @return boolean true if the experiment type is valid and recognized by the app, false otherwise.
 */
DataModel.prototype.isValidExperiment = function(experimentType) {

    return (experimentType === "LSR_FORTESSA" || experimentType === "FACS_ARIA" ||
        experimentType === "INFLUX" || experimentType === "MICROSCOPY" ||
        experimentType === "S3E" || experimentType === "MOFLO_XDP")
};

/**
 * Checks whether the experiment type is a flow cytometry experiment.
 * @param experimentType experiment type
 * @return boolean true if the experiment type is a flow cytometry experiment.
 */
DataModel.prototype.isFlowExperiment = function(experimentType) {

    return (experimentType === "LSR_FORTESSA" || experimentType === "FACS_ARIA" ||
        experimentType === "INFLUX" || experimentType === "S3E" || experimentType === "MOFLO_XDP");

};

/**
 * Checks whether the experiment type is a microscopy experiment.
 * @param experimentType experiment type
 * @return boolean true if the experiment type is a microscopy experiment.
 */
DataModel.prototype.isMicroscopyExperiment = function(experimentType) {

    return (experimentType === "MICROSCOPY");
};

/**
 * Checks whether the experiment type is a flow cytometry experiment for the analyzer class.
 * @param experimentType experiment type
 * @return boolean true if the experiment type is a flow cytometry experiment for the analyzer class.
 */
DataModel.prototype.isFlowAnalyzerExperiment = function(experimentType) {

    return (experimentType === "LSR_FORTESSA");
};

/**
 * Checks whether the experiment type is a flow cytometry experiment for the cell sorter class.
 * @param experimentType experiment type
 */
DataModel.prototype.isFlowSorterExperiment = function(experimentType) {

    return (experimentType === "FACS_ARIA" || experimentType === "INFLUX" ||
        experimentType === "S3E" || experimentType === "MOFLO_XDP");
};
