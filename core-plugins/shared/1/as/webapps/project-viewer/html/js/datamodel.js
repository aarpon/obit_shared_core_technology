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

    // All metaprojects
    this.metaprojects = {};

    // Retrieve the metaprojects
    this.openbisServer.listMetaprojects(function(response) {

        // Store the metaprojects on success
        if (response.error) {
            DATAMODEL.metaprojects = {};
        } else if (response.result) {
            DATAMODEL.metaprojects = response.result;
        } else {
            DATAMODEL.metaprojects = {};
        }

        // Retrieve all projects
        DATAMODEL.openbisServer.listProjects(function(response) {
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
        })

    });

}

/**
 * Resolve a metaproject when a reference is passed
 */
DataModel.prototype.resolveMetaproject = function(expMetaprojects, experimentType) {


    // If no metaprojects, return the empty object and stop here
    if (expMetaprojects.length === 0) {
        return expMetaprojects;
    }

    // Reference to the correct map (per experiment type)
    var metaprojectsMap;

    // Filters div
    if (experimentType === "MICROSCOPY") {
        metaprojectsMap = this.microscopyMetaprojectsMap;
    } else if (experimentType === "LSR_FORTESSA") {
        metaprojectsMap = this.flowAnalysersMetaprojectsMap;
    } else if (experimentType === "FACS_ARIA" || experimentType === "INFLUX" || experimentType === "S3E") {
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

            // Replace the ID reference with the object it points to
            var mp = this.metaProjectFromID(expMetaprojects[i]);

            if (mp !== null) {

                // Store the metaproject for future lookup
                expMetaprojects[i] = mp;
                metaprojectsMap[mp['id']] = mp;

            } else {

                console.log("Error! An experiment metaproject with id = " + expMetaprojects[i] +
                    " does not have a match in the global list of metaprojects!");
            }

            // Go to the next metaproject
            continue;
        }

        return null;
    }

    // Return the updated metaproject array.
    return expMetaprojects;

};

DataModel.prototype.metaProjectFromID = function(id) {

    if (this.metaprojects.length === 0) {
        return null;
    }

    for (var i = 0; i < this.metaprojects.length; i++) {
        if (this.metaprojects[i]['id'] === parseInt(id))
            return this.metaprojects[i];
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
