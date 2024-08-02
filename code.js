"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__);
figma.ui.resize(600, 600);
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Received message:', msg);
    if (msg.type === 'get-variables') {
        try {
            const variables = figma.variables.getLocalVariables();
            const collections = figma.variables.getLocalVariableCollections();
            const variablesData = variables.map(v => {
                const collection = collections.find(c => c.id === v.variableCollectionId);
                const modes = collection ? collection.modes : [];
                const values = modes.map(mode => ({
                    modeId: mode.modeId,
                    modeName: mode.name,
                    value: v.valuesByMode[mode.modeId]
                }));
                return {
                    id: v.id,
                    name: v.name,
                    resolvedType: v.resolvedType,
                    collectionName: collection ? collection.name : 'Unknown',
                    collectionId: v.variableCollectionId,
                    values: values
                };
            });
            const collectionsData = collections.map(c => ({
                id: c.id,
                name: c.name,
                modes: c.modes.map(m => ({ id: m.modeId, name: m.name }))
            }));
            figma.ui.postMessage({
                type: 'variables',
                variables: variablesData,
                collections: collectionsData
            });
        }
        catch (error) {
            console.error('Error fetching variables:', error);
            figma.ui.postMessage({ type: 'error', message: 'Failed to fetch variables: ' + error.message });
        }
    }
    else if (msg.type === 'create-variable') {
        try {
            console.log('Attempting to create variable:', msg);
            let collection = figma.variables.getVariableCollectionById(msg.collectionId);
            if (!collection) {
                throw new Error('Invalid collection selected');
            }
            console.log('Using collection:', collection);
            const newVariable = figma.variables.createVariable(msg.name, collection.id, msg.variableType);
            console.log('Variable created:', newVariable);
            if (msg.isAlias) {
                const aliasedVariable = figma.variables.getVariableById(msg.value.id);
                if (!aliasedVariable) {
                    throw new Error('Invalid aliased variable selected');
                }
                const modeId = collection.modes[0].modeId;
                newVariable.setValueForMode(modeId, figma.variables.createVariableAlias(aliasedVariable));
            }
            else if (msg.value !== undefined && msg.value !== null) {
                const modeId = collection.modes[0].modeId;
                newVariable.setValueForMode(modeId, msg.value);
            }
            console.log('Variable value set:', msg.value);
            figma.ui.postMessage({ type: 'refresh-variables' });
        }
        catch (error) {
            console.error('Error creating variable:', error);
            figma.ui.postMessage({ type: 'error', message: 'Failed to create variable: ' + error.message });
        }
    }
    else if (msg.type === 'update-variable') {
        try {
            const variable = figma.variables.getVariableById(msg.variableId);
            if (!variable) {
                throw new Error('Variable not found');
            }
            if (msg.name && msg.name !== variable.name) {
                variable.name = msg.name;
            }
            if (msg.value !== undefined && msg.modeId) {
                variable.setValueForMode(msg.modeId, msg.value);
            }
            figma.ui.postMessage({ type: 'refresh-variables' });
        }
        catch (error) {
            console.error('Error updating variable:', error);
            figma.ui.postMessage({ type: 'error', message: 'Failed to update variable: ' + error.message });
        }
    }
    else if (msg.type === 'create-mode') {
        try {
            const collection = figma.variables.getVariableCollectionById(msg.collectionId);
            if (!collection) {
                throw new Error('Invalid collection selected');
            }
            const newModeId = collection.addMode(msg.modeName);
            figma.ui.postMessage({ type: 'refresh-variables' });
        }
        catch (error) {
            console.error('Error creating mode:', error);
            figma.ui.postMessage({ type: 'error', message: 'Failed to create mode: ' + error.message });
        }
    }
    else if (msg.type === 'rename-mode') {
        try {
            const collection = figma.variables.getVariableCollectionById(msg.collectionId);
            if (!collection) {
                throw new Error('Invalid collection selected');
            }
            collection.renameMode(msg.modeId, msg.newName);
            figma.ui.postMessage({ type: 'refresh-variables' });
        }
        catch (error) {
            console.error('Error renaming mode:', error);
            figma.ui.postMessage({ type: 'error', message: 'Failed to rename mode: ' + error.message });
        }
    }
    else if (msg.type === 'delete-mode') {
        try {
            const collection = figma.variables.getVariableCollectionById(msg.collectionId);
            if (!collection) {
                throw new Error('Invalid collection selected');
            }
            collection.removeMode(msg.modeId);
            figma.ui.postMessage({ type: 'refresh-variables' });
        }
        catch (error) {
            console.error('Error deleting mode:', error);
            figma.ui.postMessage({ type: 'error', message: 'Failed to delete mode: ' + error.message });
        }
    }
    else if (msg.type === 'duplicate-variable') {
        try {
            const sourceVariable = figma.variables.getVariableById(msg.variableId);
            if (sourceVariable) {
                const newVariable = figma.variables.createVariable(sourceVariable.name + ' (Copy)', sourceVariable.variableCollectionId, sourceVariable.resolvedType);
                const collection = figma.variables.getVariableCollectionById(sourceVariable.variableCollectionId);
                if (collection) {
                    collection.modes.forEach(mode => {
                        const value = sourceVariable.valuesByMode[mode.modeId];
                        newVariable.setValueForMode(mode.modeId, value);
                    });
                }
                else {
                    console.warn('Collection not found for variable:', sourceVariable.name);
                }
                figma.ui.postMessage({ type: 'refresh-variables' });
            }
        }
        catch (error) {
            console.error('Error duplicating variable:', error);
            figma.ui.postMessage({ type: 'error', message: 'Failed to duplicate variable: ' + error.message });
        }
    }
    else if (msg.type === 'delete-variable') {
        try {
            const variable = figma.variables.getVariableById(msg.variableId);
            if (variable) {
                variable.remove();
                figma.ui.postMessage({ type: 'refresh-variables' });
            }
        }
        catch (error) {
            console.error('Error deleting variable:', error);
            figma.ui.postMessage({ type: 'error', message: 'Failed to delete variable: ' + error.message });
        }
    }
    else if (msg.type === 'paste-variable') {
        console.log('Attempting to paste variable:', msg);
        try {
            const { variable, collectionId } = msg;
            const targetCollection = figma.variables.getVariableCollectionById(collectionId);
            if (!targetCollection) {
                throw new Error('Target collection not found');
            }
            const newVariable = figma.variables.createVariable(variable.name + (variable.action === 'cut' ? '' : ' (Copy)'), collectionId, variable.resolvedType);
            variable.values.forEach(({ modeId, value }) => {
                newVariable.setValueForMode(modeId, value);
            });
            console.log('Variable pasted successfully:', newVariable);
            figma.ui.postMessage({ type: 'refresh-variables' });
        }
        catch (error) {
            console.error('Error pasting variable:', error);
            figma.ui.postMessage({ type: 'error', message: 'Failed to paste variable: ' + error.message });
        }
    }
});
