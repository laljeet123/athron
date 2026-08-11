import { fetchBodyParts as loadBodyParts, fetchBodyPartById as loadBodyPartById } from "./exerciseService.js";

export async function fetchBodyParts() {
  return loadBodyParts();
}

export async function fetchBodyPartById(bodyPartId) {
  return loadBodyPartById(bodyPartId);
}
