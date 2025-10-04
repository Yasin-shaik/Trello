const Workspace = require("../Models/WorkSpaceModel");
const User = require("../Models/UserModel");

const createWorkspace = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res
      .status(400)
      .json({ message: "Please provide a name for the workspace." });
  }
  try {
    const userId = req.user._id;
    const workspace = await Workspace.create({
      name,
      owner: userId,
      members: [userId],
    });
    res.status(201).json({
      message: "Workspace created successfully.",
      workspace,
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    res.status(500).json({ message: "Server error creating workspace." });
  }
};

const listWorkspaces = async (req, res) => {
  try {
    const userId = req.user._id;
    const workspaces = await Workspace.find({
      $or: [{ owner: userId }, { members: userId }],
    }).select("-members");
    res.status(200).json(workspaces);
  } catch (error) {
    console.error("Error listing workspaces:", error);
    res.status(500).json({ message: "Server error listing workspaces." });
  }
};

const joinWorkspace = async (req, res) => {
  const { workspaceId } = req.body;
  if (!workspaceId) {
    return res
      .status(400)
      .json({ message: "Workspace ID is required to join." });
  }
  try {
    const userId = req.user._id;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }
    const isMember = workspace.members
      .map((id) => id.toString())
      .includes(userId.toString());
    if (isMember) {
      return res
        .status(400)
        .json({ message: "You are already a member of this workspace." });
    }
    workspace.members.push(userId);
    await workspace.save();
    res.status(200).json({
      message: `Successfully joined workspace: ${workspace.name}`,
      workspace,
    });
  } catch (error) {
    console.error("Error joining workspace:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid Workspace ID format." });
    }
    res.status(500).json({ message: "Server error joining workspace." });
  }
};

module.exports = {
  createWorkspace,
  listWorkspaces,
  joinWorkspace,
};
