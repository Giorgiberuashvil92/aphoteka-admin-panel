/**
 * თუ MONGODB_URI env აკლია — იგივე ნაგულისხმევი რაც Mongoose-ს app.module-ში.
 * პროდაქშენში env ყოველთვის დააყენე; ეს მხოლოდ ლოკალური/dev სინქია seed-თან.
 */
export const DEFAULT_MONGODB_URI =
  'mongodb+srv://Giorgiberuashvili92:Berobero1@aphoteka.kitkuk2.mongodb.net/aphoteka_db?retryWrites=true&w=majority&appName=aphoteka';
