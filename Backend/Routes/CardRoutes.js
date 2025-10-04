const express = require("express");
const {
  createCard,
  getCardsByList,
  getCard,
  updateCard,
  moveCard,
  toggleAssignee,
  toggleLabel,
  deleteCard,
  checkCardAccess,
  getComments,
  addComment,
  deleteComment,
} = require("../Controllers/CardController");
const { protect } = require("../Middleware/AuthMiddleware");

const router = express.Router();

router.use(protect);

router.put("/assign", toggleAssignee);
router.put("/label", toggleLabel);
router.put("/move", moveCard);
router.post("/", createCard);
router.get("/", getCardsByList);
router.get("/:cardId/comments", checkCardAccess, getComments);
router.post("/:cardId/comments", checkCardAccess, addComment);
router.delete("/:cardId/comments/:commentId", checkCardAccess, deleteComment);
router.route("/:id").get(getCard).put(updateCard).delete(deleteCard);

module.exports = router;
